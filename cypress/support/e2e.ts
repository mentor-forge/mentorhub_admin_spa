import { registerAuthCommands } from '@mentor-forge/mentorhub_spa_utils/cypress/registerAuthCommands'
import './commands'

registerAuthCommands({ visitPath: '/admin/' })

export {}
