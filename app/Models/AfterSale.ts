import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
interface StatusTransition {
    last_status: string
    new_status: string
    timestamp: DateTime
}
export default class AfterSale extends BaseModel {
    @column({ isPrimary: true })
    public id: number

    @column()
    public userId: number

    @column()
    public imei: string

    @column()
    public newImei: string | null

    @column()
    public note: string

    @column()
    public status: string

    @column()
    public statusTransitions: Array<StatusTransition> | string

    @column.dateTime({ autoCreate: true })
    public createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    public updatedAt: DateTime
}