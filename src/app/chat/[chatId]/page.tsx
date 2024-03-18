
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import React from 'react'
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import ChatSidebar from '@/components/ChatSidebar';
import PDFViewer from '@/components/PDFViewer';
import ChatComponent from '@/components/ChatComponent';

type Props = {
    params: {
        chatId: string;
    }
}

const ChatPage = async ({params: {chatId}}: Props) => {
    //console.log('chatid: ',chatId);
    const {userId} = await auth()
    if(!userId) {
        return redirect('/sign-in')
    }
    const _chats = await db.select().from(chats).where(eq(chats.userId,userId));
    if (!_chats.find((chat) => chat.id === parseInt(chatId))) {
        return redirect("/");
      }
      const currentChat = _chats.find((chat) => chat.id === parseInt(chatId));
      //console.log(currentChat?.pdfUrl) 
      return (
        <div className='flex max-h-screen'>
            <div className='flex w-full max-h-screen'>
                {/*chat sidebar*/}
                <div className='flex-[2] max-w-xs'>
                    <ChatSidebar chats ={_chats} chatId={parseInt(chatId)}/>
                </div>
                {/*pdf viewer*/}
                <div className='max-h-screen p-4 overflow-scroll flex-[4]'>
                    <PDFViewer pdf_url={currentChat?.pdfUrl || ""}/>
                </div>
                {/*chat component*/}
                <div className='flex-[3] border-1-4 border-1-slate-200 bg-white'>
                    <ChatComponent chatId={parseInt(chatId)}></ChatComponent>
                </div>
            </div>
        </div>
      ) 
};

export default ChatPage