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

  @column()
  public userSessionId: string

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

}
