import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { Database, defaultDatabase } from './schema'
import { config } from '../config'

// Initialize database with JSON file adapter
const adapter = new JSONFile<Database>('./data/database.json')
export const db = new Low<Database>(adapter, defaultDatabase)

// Initialize database (create file if it doesn't exist)
export async function initializeDatabase() {
  try {
    // Read data from JSON file, this will set db.data to the file content
    // If file doesn't exist, it will be created
    await db.read()
    
    // If file is empty or corrupted, set default data
    if (!db.data) {
      db.data = defaultDatabase
    }
    
    // Write default data to file if needed
    await db.write()
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

// Helper functions for database operations
export async function readDatabase(): Promise<Database> {
  await db.read()
  return db.data || defaultDatabase
}

export async function writeDatabase(): Promise<void> {
  await db.write()
}

export { db as database } 