import '../both/index.js'

//publications
import '/imports/api/bounties/server/publications'
import '/imports/api/hashing/server/publications.js'
import '/imports/api/miscellaneous/server/publications'
import '/imports/api/users/server/publications'
import '/imports/api/wallet/server/publications'
import '/imports/api/developers/server/publications'
import '/imports/api/ratings/server/publications'
import '/imports/api/features/server/publications'
import '/imports/api/communities/server/publications'
import '/imports/api/coins/server/publications'
import '/imports/api/redflags/server/publications'
import '/imports/api/activityLog/server/publications'
import '/imports/api/auctions/server/publications'
import '/imports/api/summaries/server/publications'
import '/imports/api/problems/server/publications'
import '/imports/api/exchanges/server/publications'


//server methods- don't make these, they get bundled with client and are callable from client anyhow, only detracts optimistc UI


// import './fastRender.js'
import './fixtures.js'
import './routes.js'

import '/imports/api/auctions/server/startup'
import '/imports/api/rewards/server/startup'
import '/imports/api/problems/server/startup'

// collection configs
import '/imports/api/users/users.js'
import '/imports/api/users/usersStats.js'
import '/imports/api/coins/currencies.js'
