import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class FCMDevice extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public token: string

  @column()
  public userId: number
  
  @column()
  public platform: string

  @column()
  public token_md5: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

}
