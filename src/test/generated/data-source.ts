import 'reflect-metadata'
import { DataSource, DataSourceOptions } from 'typeorm'
import { getBaseConfig } from '../../'

export const AppDataSource = new DataSource({
    ...getBaseConfig()
} as DataSourceOptions)
