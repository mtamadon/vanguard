import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  public id: number



  @column()
  chatId: number

  @column()
  userId: number

  @column()
  messageType: string

  @column()
  message: string

  @column()
  meta: Object | string

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
