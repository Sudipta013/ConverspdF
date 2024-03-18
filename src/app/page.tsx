import { Button } from "@/components/ui/button";
import { UserButton, auth } from "@clerk/nextjs";
import Link from 'next/link';
import {LogIn, ArrowRight } from 'lucide-react';
import FileUpload from "@/components/ui/FileUpload";
import {Noto_Serif_Display} from 'next/font/google'
import { checkSubscription } from "@/lib/subscription";
import SubscriptionButton from "@/components/subscriptionButton";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const Noto_Serif_Display_init = Noto_Serif_Display({
  subsets: ['latin'],
  weight : ['100','200','300','400','500'],
})

export default async function Home() {
  const {userId} = await auth()
  const isAuth = !!userId;
  const isPro = await checkSubscription();
  let firstChat;
  if(userId){
    firstChat = await db.select().from(chats).where(eq(chats.userId,userId))
    if (firstChat){
      firstChat = firstChat[0]
    }
  }
  return (
    <main className="w-screen min-h-screen bg-[#030519]">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center">
              <h1 className={`${Noto_Serif_Display_init.className} mr-3 text-8xl text-indigo-400 font-Noto_Serif_Display mb-6`}>ConverspdF</h1>
              <UserButton afterSignOutUrl="/"></UserButton>
            </div>

            <div className="flex mt-2 mb-6">
              {isAuth && firstChat && (
                <Link href={`/chat/${firstChat.id}`}>
                  <Button className="">
                    Go to Chats <ArrowRight className="ml-2" />{' '}
                  </Button>
                </Link>)}
                <div className="ml-3">
                  <SubscriptionButton isPro={isPro} />
                </div>
            </div>

            <p className=" text-base text-gray-300/75 leading-relaxed mb-6">
              Discover a new realm of pdf exploration with <span className="font-semibold text-indigo-200 ">ConversPDF</span>: AI revolutionizes document interaction. Instantly unlock insights, simplify complexity, and join global community transforming knowledge engagement.
            </p>

            <div className="w-full mt-4">
              {isAuth ? (<FileUpload/>):(
                <Link href="/sign-in">
                  <Button className="font-semibold transition ease-in-out delay-150 bg-blue-500 hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500 duration-300 ...">
                    Login to get Started!
                    <LogIn className="w-4 h-4 ml-2"></LogIn>
                  </Button>
                </Link>
              ) }
            </div>
          </div>
       </div>
    </main>
  )
}
