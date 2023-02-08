import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, computed, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Chat from './Chat'
import Message from './Message'
import GeoFence from './GeoFence'
import Reminder from './Reminder'
import GeoFenceHistory from './GeoFenceHistory'
interface SupportedFeatures {
  fuel_usage: boolean
  driver_name: boolean
}


export default class Tracker extends BaseModel {
  @column({ isPrimary: true })
  public imei: number

  @column()
  public model: string

  @column()
  public title: string | null

  @column()
  public userId: number | null

  @column()
  public driverName: string | null

  @column()
  public avatar: string | null

  @column()
  public usage: string

  @column()
  public resellerId: number | null

  @column()
  public installerId: number | null

  @column()
  public simcardNumber: string | null

  @column()
  public firstConnectedAt: DateTime | null

  @column()
  public firstAssignedAt: DateTime | null

  @column()
  public WarrantyExpiresAt: DateTime | null

  @column()
  public expiresAt: DateTime | null

  @column()
  public fuelUsage: number | null

  @column()
  public soldToResellerAt: DateTime | null

  @column()
  public status: number

  @computed()
  public get status_code() {
    if (this.status == 0) {
      return "disabled"
    } else if (this.status == 1) {
      return "active"
    } else if (this.status == 2) {
      return "disabled_by_user"
    }
  }

  @column()
  public supportedFeatures: SupportedFeatures

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @column.dateTime({
    autoCreate: true, serialize: (value: DateTime | null) => {
      return value ? value.setZone('utc').toISO() : value
    }
  })
  public createdAt: DateTime

  @column.dateTime({
    autoCreate: true, autoUpdate: true, serialize: (value: DateTime | null) => {
      return value ? value.setZone('utc').toISO() : value
    }
  })
  public updatedAt: DateTime


  public static async postUnassignTracker(imei: number) {
    // remove chats and messages
    const chat = await Chat.findBy('tracker_imei', imei)
    if (chat) {
      await chat.delete()
      await Message.query().where('chat_id', chat.id).delete()
    }

    // remove geo fence
    await GeoFence.query().where('tracker_imei', imei).delete()

    await Reminder.query().where('tracker_imei', imei).delete()
    await GeoFenceHistory.query().where('tracker_imei', imei).delete()
    
  }
}