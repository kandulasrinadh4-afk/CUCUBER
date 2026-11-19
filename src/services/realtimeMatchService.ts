import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MatchReaction, ReactionType, CommunityPoll } from '../types';

/**
 * Returns a stable, Firestore rules-compliant client UID.
 * If the user is logged into Firebase Auth, returns `auth.currentUser.uid`.
 * If unauthenticated, generates or retrieves a stable guest UID stored in localStorage
 * that matches the `^guest_[a-zA-Z0-9_\\-]+$` pattern expected by Firestore security rules.
 */
export function getPulseClientId(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  const STORAGE_KEY = 'cricket_fan_pulse_uid';
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.startsWith('guest_') && /^[a-zA-Z0-9_\\-]+$/.test(existing) && existing.length <= 64) {
      return existing;
    }
    const freshId = `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE_KEY, freshId);
    return freshId;
  } catch {
    return `guest_client_${Date.now().toString(36)}`;
  }
}

/**
 * Subscribes in real time to live match reactions from Firestore (`matches/{matchId}/reactions`).
 * Updates immediately across all connected clients and tabs whenever a fan reacts or shouts.
 */
export function subscribeToMatchReactions(
  matchId: string,
  onUpdate: (reactions: MatchReaction[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!matchId) {
    onUpdate([]);
    return () => {};
  }

  try {
    const reactionsRef = collection(db, 'matches', matchId, 'reactions');
    const q = query(reactionsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: MatchReaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            matchId,
            userId: data.userId || 'fan',
            userName: data.userName || 'Cricket Fan',
            userAvatar: data.userAvatar,
            reactionType: (data.reactionType as ReactionType) || 'cheer',
            message: data.message || undefined,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          });
        });
        onUpdate(list);
      },
      (err) => {
        console.warn('[Firestore] Reactions snapshot error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to match reactions:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

/**
 * Posts a real-time reaction or commentary shout to the match in Firestore.
 * Associates the reaction with matchId, userId, userName, timestamp, and optional message.
 */
export async function sendMatchReaction(
  matchId: string,
  reactionType: ReactionType,
  message?: string,
  userOverride?: { uid?: string; displayName?: string | null; photoURL?: string | null }
): Promise<void> {
  if (!matchId) {
    throw new Error('Cannot send reaction without a valid match ID.');
  }

  const currentAuthUser = auth.currentUser;
  const uid = currentAuthUser?.uid || userOverride?.uid || getPulseClientId();
  const userName = (currentAuthUser?.displayName || userOverride?.displayName || 'Cricket Fan').trim().slice(0, 60) || 'Cricket Fan';
  const userAvatar = currentAuthUser?.photoURL || userOverride?.photoURL || undefined;

  const reactionDocId = `rx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const reactionRef = doc(db, 'matches', matchId, 'reactions', reactionDocId);

  const payload: Record<string, any> = {
    id: reactionDocId,
    matchId,
    userId: uid,
    userName,
    reactionType,
    createdAt: Date.now(),
    timestamp: serverTimestamp(),
  };

  if (userAvatar) {
    payload.userAvatar = userAvatar;
  }

  if (message && message.trim()) {
    payload.message = message.trim().slice(0, 140);
  }

  await setDoc(reactionRef, payload);
}

/**
 * Subscribes in real time to the live prediction poll document in Firestore (`community_polls/{pollId}`).
 * Updates vote totals and percentages in real time across all open tabs.
 */
export function subscribeToCommunityPoll(
  pollId: string,
  defaultPoll: CommunityPoll,
  onUpdate: (poll: CommunityPoll) => void,
  onError?: (err: Error) => void
): () => void {
  if (!pollId) {
    onUpdate(defaultPoll);
    return () => {};
  }

  try {
    const pollRef = doc(db, 'community_polls', pollId);

    const unsubscribe = onSnapshot(
      pollRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const rawOptions = Array.isArray(data.options) ? data.options : defaultPoll.options;
          const cleanOptions = rawOptions.map((opt: any) => ({
            id: String(opt.id || ''),
            label: String(opt.label || opt.id || ''),
            votes: typeof opt.votes === 'number' && opt.votes >= 0 ? opt.votes : 0,
          }));

          const calculatedTotal = cleanOptions.reduce((sum: number, o: { votes: number }) => sum + o.votes, 0);
          const totalVotes = typeof data.totalVotes === 'number' && data.totalVotes >= calculatedTotal
            ? data.totalVotes
            : calculatedTotal;

          onUpdate({
            id: pollId,
            matchId: data.matchId || defaultPoll.matchId,
            question: data.question || defaultPoll.question,
            options: cleanOptions,
            totalVotes,
            updatedAt: data.updatedAt,
          });
        } else {
          // Document does not exist yet on server; render clean default poll (with 0 votes)
          onUpdate(defaultPoll);
        }
      },
      (err) => {
        console.warn('[Firestore] Poll snapshot error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to community poll:', err);
    if (onError && err instanceof Error) onError(err);
    onUpdate(defaultPoll);
    return () => {};
  }
}

/**
 * Subscribes to the specific user's vote record for a given poll (`community_polls/{pollId}/votes/{userId}`).
 * Enables the UI to display whether the user has already voted and lock further voting.
 */
export function subscribeToUserPollVote(
  pollId: string,
  userId: string,
  onVoteLoaded: (selectedOption: string | null) => void,
  onError?: (err: Error) => void
): () => void {
  if (!pollId || !userId) {
    onVoteLoaded(null);
    return () => {};
  }

  try {
    const voteRef = doc(db, 'community_polls', pollId, 'votes', userId);
    const unsubscribe = onSnapshot(
      voteRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onVoteLoaded(data.selectedOption || null);
        } else {
          onVoteLoaded(null);
        }
      },
      (err) => {
        console.warn('[Firestore] User vote snapshot error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to user vote:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

/**
 * Casts a vote on a community poll using an atomic Firestore transaction.
 * - Prevents duplicate votes: if the user already has a vote record, rejects the vote.
 * - Atomically creates or increments option counts and total votes in `community_polls/{pollId}`.
 * - Writes the individual user vote to `community_polls/{pollId}/votes/{userId}`.
 */
export async function castCommunityPollVote(
  pollId: string,
  userId: string,
  selectedOptionId: string,
  defaultPoll: CommunityPoll
): Promise<void> {
  if (!pollId || !userId || !selectedOptionId) {
    throw new Error('Missing parameters required to cast poll vote.');
  }

  const pollRef = doc(db, 'community_polls', pollId);
  const voteRef = doc(db, 'community_polls', pollId, 'votes', userId);

  await runTransaction(db, async (transaction) => {
    const voteSnap = await transaction.get(voteRef);
    if (voteSnap.exists()) {
      throw new Error('You have already cast your vote on this match poll.');
    }

    const pollSnap = await transaction.get(pollRef);
    let options: { id: string; label: string; votes: number }[] = [];

    if (pollSnap.exists()) {
      const existingData = pollSnap.data();
      const existingOptions = Array.isArray(existingData.options) ? existingData.options : defaultPoll.options;
      options = existingOptions.map((opt: any) => ({
        id: String(opt.id),
        label: String(opt.label || opt.id),
        votes: typeof opt.votes === 'number' && opt.votes >= 0 ? opt.votes : 0,
      }));
    } else {
      options = defaultPoll.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        votes: 0,
      }));
    }

    let optionMatched = false;
    options = options.map((opt) => {
      if (opt.id === selectedOptionId) {
        optionMatched = true;
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    if (!optionMatched) {
      options.push({ id: selectedOptionId, label: selectedOptionId, votes: 1 });
    }

    const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

    // Save individual vote record (preventing duplicate votes)
    transaction.set(voteRef, {
      userId,
      pollId,
      selectedOption: selectedOptionId,
      votedAt: Date.now(),
      timestamp: serverTimestamp(),
    });

    // Save updated poll tally
    transaction.set(
      pollRef,
      {
        id: pollId,
        matchId: defaultPoll.matchId,
        question: defaultPoll.question,
        options,
        totalVotes,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}
