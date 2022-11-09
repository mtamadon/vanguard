import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Tracker from "App/Models/Tracker"
import User from 'App/Models/User'

export default class AdminsController {
    public async trackerIndex({ response,params }: HttpContextContract) {
        const imei = params.imei
        const model = params.model
        const userPhoneNumber = params.userPhoneNumber
        if(!imei && !model && !userPhoneNumber){
            return response.json({trackers: await Tracker.all()})
        }

        var tracker 
        // first imei,then phonenum,then model
        if(imei){
            tracker = await Tracker.find(imei)
            if(!tracker){
                return response.status(404).json({ message: 'ردیاب یافت نشد.' })
            }
            return response.json({tracker: tracker})
        }
        
        if(userPhoneNumber){
            const user = await User.findBy('phone_number',userPhoneNumber)
            if(!user){
                return response.status(404).json({ message: 'کاربر یافت نشد.' })
            }
           const trackers = await Tracker.query().where('user_id',user.id)
            return response.json({trackers: trackers})
        }
        if(model){
            const trackers = await Tracker.query().where('model',model)
            return response.json({trackers: trackers})
        }
    }
    
    public async addTracker({ request, response }: HttpContextContract) {
        const imeis:string[] = request.input('imeis')
        var model = request.input('model')
        const supported_features = request.input('supported_features')
        const trackers = imeis.map(imei => { const tracker = new Tracker()
            tracker.imei = imei // type string is not assignable to number
            tracker.model = model
            tracker.supportedFeatures = supported_features
        }, this)
        await Tracker.createMany(trackers) 
        return response.json({success : true})
    }
    
    public async removeTracker({ response, params }: HttpContextContract) {
        const tracker = await Tracker.find(params.imei)
        if (!tracker) {
            return response.status(404).json({ message: 'ردیاب یافت نشد.' })
        }
        await tracker.delete()
        return response.json({ success : true })
    }
    
    public async updateTracker({request,response,params} : HttpContextContract){
        const imei = params.imei
        const {model,resellerID,installerID,WarrantyExpiresAt,SoldToResellerAt,Status,SupportedFeatures} = request.all()
        const tracker = await Tracker.find(imei)
        if (!tracker) {
            return response.status(404).json({ message: 'ردیاب یافت نشد.' })
        }
        tracker.model = model
        tracker.resellerID = resellerID
        tracker.installerID = installerID
        tracker.WarrantyExpiresAt = WarrantyExpiresAt
        tracker.soldToResellerAt = SoldToResellerAt
        tracker.status = Status
        tracker.supportedFeatures = SupportedFeatures
        await tracker.save()
        return response.json({success : true})
}
}
