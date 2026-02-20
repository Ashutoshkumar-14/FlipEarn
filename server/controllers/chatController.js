import Prisma from "../configs/prisma.js";

//controllers for getting chatv( creating if not exist)
export const getChat = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { listingId, chatId } = req.body;

        const listing = await Prisma.listing.findUnique({
            where: { id: listingId }
        })
        if (!listing) return res.status(404).json({ message: "Listing not found" })

        // Find Existing Chat
        let existingChat = null;
        if (chatId) {
            existingChat = await Prisma.chat.findFirst({
                where: { id: chatId, OR: [{ chatUserId: userId }, { ownerUserId: userId }] },
                include: { listing: true, ownerUser: true, chatUser: true, messages: true }
            })
        } else {
            existingChat = await Prisma.chat.findFirst({
                where: { listingId, chatUserId: userId, ownerUserId: listing.ownerId },
                include: { listing: true, ownerUser: true, chatUser: true, messages: true }
            })
        }
        if (existingChat) {
            res.json({ chat: existingChat });
            if (existingChat.isLastMessageRead === false) {
                const lastMessage = existingChat.messages[existingChat.messages.length - 1];
                const isLastMessageSendByMe = lastMessage.senderId === userId;
                if (!isLastMessageSendByMe) {
                    await Prisma.chat.update({
                        where: { id: existingChat.id },
                        data: { isLastMessageRead: true }
                    })
                }
            }
            return null;
        }
        const newChat = await Prisma.chat.create({
            data: {
                listingId,
                chatUserId: userId,
                ownerUserId: listing.ownerId,
            }
        })
        const chatWithData = await Prisma.chat.findUnique({
            where: { id: newChat.id },
            include: { listing: true, ownerUser: true, chatUser: true, messages: true }
        })
        return res.json({ chat: chatWithData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });

    }
}
//Controllers for getting all user chats
export const getAllUserChats = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const chats = await Prisma.chat.findMany({
            where: { OR: [{ chatUserId: userId }, { ownerUserId: userId }] },
            include: { listing: true, ownerUser: true, chatUser: true, messages: true },
            orderBy: { updatedAt: "desc" }
        })
        if (!chats || chats.length === 0) {
            return res.json({ chats: [] });
        }
        return res.json({ chats });


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });

    }
}

//controllers for adding message to chats
export const sendChatMessage = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { chatId, message } = req.body;
        const chat = await Prisma.chat.findFirst({
            where: {
                AND: [{ id: chatId }, { OR: [{ chatUserId: userId }, { ownerUserId: userId }] }]
            },
            include: { listing: true, ownerUser: true, chatUser: true, messages: true }


        })
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        } else if (chat.listing.status !== "active") {
            return res.status(400).json({ message: `Listing is ${chat.listing.status}` });
        }
        const newMessage = {
            message,
            sender_id: userId,
            chatId,
            createdAt: new Date()
        }
        await Prisma.message.create({
            data: newMessage
        })
        res.json({ message: "Message sent successfully", newMessage });

        await Prisma.chat.update({
            where: { id: chatId },
            data: { lastMessage: newMessage.message, isLastMessageRead: false, lastMessageSenderId: userId }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });

    }
}