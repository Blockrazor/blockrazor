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

//server methods
import '/imports/api/coins/server/methods'
import '/imports/api/wallet/server/methods'
import '/imports/api/activityLog/server/methods'
import '/imports/api/developers/server/methods'
import '/imports/api/users/server/methods'
import '/imports/api/communities/server/methods'
import '/imports/api/hashing/server/methods'
import '/imports/api/auctions/server/methods'
import '/imports/api/rewards/server/methods'
import '/imports/api/summaries/server/methods'
import '/imports/api/problems/server/methods'
import '../../api/bounties/server/methods.js'


// import './fastRender.js'
import './fixtures.js'

import '/imports/api/auctions/server/startup'
import '/imports/api/rewards/server/startup'
import '/imports/api/problems/server/startup'

// collection configs
import '/imports/api/users/users.js'
import '/imports/api/coins/currencies.js'
