import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Tracker from './Tracker'
export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number


  @column()
  public name: string

  @column()
  public email: string

  @column()
  public phoneNumber: string

  @column()
  public role: number

  @column()
  public avatar: string | null

  @column()
  public password: string

  @column()
  public status: number

  @column()
  public city: string | null

  @column()
  public language: string | null

  @column()
  public country: string

  @hasMany(() => Tracker)
  public trackers: HasMany<typeof Tracker>

  @column.dateTime({
    autoCreate: true,
    serialize: (value: DateTime | null) => {
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
