import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class UserSession extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public userId: string

  @column()
  public token: string

  @column.dateTime()
  public expiresAt: DateTime
  
  @column.dateTime()
  public lastAccessedAt: DateTime

  @column()
  public appVersion: string | null

  @column()
  public ip: string | null

  @column()
  public userAgent: string | null

  @column()
  public serviceId: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
