import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Chat from "App/Models/Chat";
import Message from 'App/Models/Message';

export default class ChatsController {

    public async index({ response, userId }: HttpContextContract) {
        const chats = await Chat.query().where('user_id', userId).orderBy('updated_at', 'desc')
        //if support chat is not exist, create it
        let supportChat = chats.find(chat => chat.chatType == "support")
        if (!supportChat) {
            supportChat = new Chat()
            supportChat.userId = userId
            supportChat.chatType = "support"
            supportChat.title = "پشتیبانی"
            supportChat.newMessages = 1
            await supportChat.save()
            // add chat to chats array
            chats.push(supportChat)
            // add first message to support chat
            const firstMessage = new Message()
            firstMessage.userId = userId
            firstMessage.chatId = supportChat.id
            firstMessage.messageType = "admin_support"
            firstMessage.message = "باسلام به کاربر گرامی خوش آمدید. لطفا سوالات خود را از طریق این چت پشتیبانی بپرسید."
            firstMessage.meta = {
                "agent_id": 1,
            }
            await firstMessage.save()
        }

        return response.json({
            chats: chats
        })
    }

    public async showMessages({ response, request, userId }: HttpContextContract) {
        let chatId = request.input('chat_id')
        const chat = await Chat.find(chatId)
        if (!chat) {
            return response.status(404).json({ message: 'چت یافت نشد.' })
        }
        if (chat.userId != userId) {
            return response.status(400).json({ message: 'این چت متعلق به شما نمی باشد.' })
        }

        chat.newMessages = 0
        await chat.save()

        let messages = await Message.query().where('chat_id', chatId).if(request.input('from_date_time'), (query) => {
            query.where('created_at', '>=', request.input('from_date_time'))
        }).if(request.input('before_message_id') != '0', (query) => {
            query.where('id', '<', request.input('before_message_id'))
        }).if(request.input('after_message_id') != '0', (query) => {
            query.where('id', '>', request.input('after_message_id'))
        }).if(request.input('message_type'), (query) => {
            query.where('message_type', request.input('message_type'))
        }).orderBy('id', this.queryOrderType(request)).limit(20)

        if (this.queryOrderType(request) == 'desc') {
            messages = messages.reverse()
        }
        return response.json({
            messages: messages,
            first_message_id: messages.length > 0 ? messages[0].id : null,
            last_message_id: messages.length > 0 ? messages[messages.length - 1].id : null,
            chat: chat
        })
    }
    public queryOrderType(request) {
        if (request.input('from_date_time')) {
            return 'desc'
        } else if (request.input('before_message_id')) {
            return 'desc'
        } else if (request.input('after_message_id')) {
            return 'asc'
        } else {
            return 'desc'
        }
    }
    public async sendMessage({ request, response, userId }: HttpContextContract) {
        const { chat_id, message } = request.all()
        const chat = await Chat.find(chat_id)
        if (!chat) {
            return response.status(404).json({ message: 'چت یافت نشد.' })
        }
        if (chat.userId != userId) {
            return response.status(400).json({ message: 'این چت متعلق به شما نمی باشد.' })
        }

        if (chat.chatType != "support") {
            return response.status(400).json({ message: 'شما نمی توانید پیام ارسال کنید.' })
        }

        const newMessage = new Message()
        newMessage.userId = userId
        newMessage.chatId = chat_id
        newMessage.messageType = "user_support"
        newMessage.message = message
        newMessage.meta = {}
        await newMessage.save()
        return response.json({ success: true })
    }

    public async readAll({ response, userId }: HttpContextContract) {
        await Chat.query().where('user_id', userId).update({ newMessages: 0 })
        return response.json({ success: true })
    }
}
