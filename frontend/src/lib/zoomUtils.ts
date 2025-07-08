import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

export async function sendZoomLinkToChat(participants: string[], zoomJoinUrl: string, meetingTitle: string, senderId: string) {
  if (!participants || !zoomJoinUrl) return;
  for (const participant of participants) {
    const chatId = [senderId, participant].sort().join('_');
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesCol, {
      text: `Zoom meeting scheduled: ${meetingTitle}\nJoin here: ${zoomJoinUrl}`,
      senderId,
      timestamp: serverTimestamp(),
      system: true
    });
  }
} 