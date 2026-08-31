// Cypress E2E support file — auth via spa_utils (JWT + localStorage, no login UI).

import { registerAuthCommands } from '@mentor-forge/mentorhub_spa_utils/cypress/registerAuthCommands'
import './commands'

// The app is mounted under the `/admin/` journey prefix (Vite base + container nginx),
// so the first navigation must be prefixed: an un-prefixed visit is not a shape that
// exists behind welcome nginx or the ALB.
registerAuthCommands({ visitPath: '/admin/' })

export {}
