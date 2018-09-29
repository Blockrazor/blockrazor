//grouped by their api folders

import { HashAlgorithm } from './hashing/hashAlgorithm.js'
import { HashAverage } from './hashing/hashAverage.js'
import { HashHardware } from './hashing/hashHardware.js'
import { HashPower } from './hashing/hashPower.js'
import { HashPowerImages } from './hashing/hashPowerImages.js'
import { HashUnits } from './hashing/hashUnits.js'

import { FormData } from "./miscellaneous/formData.js"
import { GraphData } from "./miscellaneous/graphData.js"
import { AppLogs } from './miscellaneous/appLogs'

import { UserData } from './users/userData.js'
import { ProfileImages } from './users/profileImages'
import { UsersStats } from './users/usersStats'

import { Bounties } from './bounties/bounties.js'
import { BountyTypes } from './bounties/bountyTypes.js'
import { REWARDCOEFFICIENT } from './bounties/REWARDCOEFFICIENT.js'

import { WalletImages } from './wallet/walletImages.js'
import { Wallet } from './wallet/wallet.js'

import { Communities } from './communities/communities.js'

import { Developers } from './developers/developers.js'
import { Codebase } from './developers/codebase.js'

import { Ratings } from './ratings/ratings'
import { RatingsTemplates } from './ratings/ratingsTemplates'
import { EloRankings } from './ratings/eloRankings'

import { Features } from './features/features.js'

import { Currencies } from '/imports/api/coins/currencies.js'
import { PendingCurrencies } from '/imports/api/coins/pendingCurrencies.js'
import { RejectedCurrencies } from '/imports/api/coins/rejectedCurrencies.js'
import { ChangedCurrencies } from '/imports/api/coins/changedCurrencies.js'

import { Redflags } from '/imports/api/redflags/redflags.js'

import { ActivityLog } from '/imports/api/activityLog/activityLog.js'
import { ActivityIPs } from '/imports/api/activityLog/activityIPs'

import { Bids } from '/imports/api/auctions/bids'
import { Auctions } from '/imports/api/auctions/auctions'

import { Summaries } from '/imports/api/summaries/summaries'

import { Payments } from '/imports/api/payments/payments'

import { Problems } from '/imports/api/problems/problems'
import { ProblemImages } from '/imports/api/problems/problemImages'
import { ProblemComments } from '/imports/api/problems/problemComments'

import { Exchanges } from '/imports/api/exchanges/exchanges'
import { Encryption } from '/imports/api/encryption/encryption'
import { Translations } from '/imports/api/translations/translations'

import { developmentValidationEnabledFalse } from '/imports/startup/both/developmentValidationEnabledFalse'

//We can delete launchEmail after launch of BlockRazor
import { launchEmails } from '/imports/api/launchEmails/launchEmails.js'

export {
  Exchanges,

  Bounties,
  BountyTypes,
  REWARDCOEFFICIENT,

  Currencies,
  PendingCurrencies,
  RejectedCurrencies,
  ChangedCurrencies,

  FormData,
  GraphData,
  AppLogs,
  
  HashAlgorithm,
  HashAverage,
  HashHardware,
  HashPower,
  HashUnits,
  HashPowerImages,

  UserData,
  UsersStats,
  ProfileImages,

  Ratings,
  RatingsTemplates,
  EloRankings,

  WalletImages,
  Wallet,

  Codebase,
  Developers,

  Communities,

  Features,

  Redflags,

  ActivityLog,
  ActivityIPs,

  Bids,
  Auctions,

  Summaries,

  Problems,
  ProblemImages,
  ProblemComments,
  
  developmentValidationEnabledFalse,

  launchEmails,

  Payments,

  Encryption,
  Translations
}