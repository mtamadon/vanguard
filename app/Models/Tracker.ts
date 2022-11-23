import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, computed, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
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
  public resellerID: number | null

  @column()
  public installerID: number | null

  @column()
  public simcardNumber: string | null

  @column()
  public firstConnectedAt: DateTime | null

  @column()
  public firstAssignedAt: DateTime | null

  @column()
  public WarrantyExpiresAt: DateTime | null

  @column()
  public ExpiresAt: DateTime | null

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

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}