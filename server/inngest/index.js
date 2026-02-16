// import { Prisma } from "@prisma/client";
import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import Prisma from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "profile-marketplace" });

// Inngest function to save usr data toa database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { data} =event
    //Check if the user already exist in the database
    const user = await Prisma.user.findFirst({
        where: {id: data.id}
    })
    if(user){
        //Update the user data if it exists
        await Prisma.user.update({
            where: {id: data.id},
            data: {
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " " + data?.last_name,
                image: data?.image_url,
            }
        })
        return;
    }
    await Prisma.user.create({
        data: {
            id: data.id,
            email: data?.email_addresses[0]?.email_address,
            name: data?.first_name + " " + data?.last_name,
            image: data?.image_url,

        }
    })
  },
);

// Inngest function to delete user from database

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { data} =event

    const listings = await Prisma.listing.findMany({
        where: {OwnerId: data.id}
    })

    const chats = await Prisma.chat.findMany({
        where: {OR: [{ownerUserId: data.id }, {chatUserId: data.id}]}
    })
    const transactions = await Prisma.transaction.findMany({
        where: {userId: data.id}
    })
    if(listings.length ===0 && chats.length ===0 && transactions.length ===0){
        await Prisma.user.delete({where: {id: data.id}})
    }else{
        await Prisma.listing.updateMany({
            where: {OwnerId: data.id},
            data: {status: "inactive"}
        })
    }
       
  },
);

// Inngest function to update user from database

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { data} =event
   
    await Prisma.user.update({
        where: {id: data.id},
        data: {
            email: data?.email_addresses[0]?.email_address,
            name: data?.first_name + " " + data?.last_name,
            image: data?.image_url,

        }
    })
  },
);


// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
];