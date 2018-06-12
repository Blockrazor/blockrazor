// ***************************************************************
// Bundle for client modules
// ***************************************************************

// Modules and Config
import "./config";
import ('/imports/ui/components/compatability/index.js')
import ('bootstrap')
import '/imports/api/users/client/users.js'
import '/imports/api/miscellaneous/mime'
import '../both/routes.js'
import ('./testingCollectionGlobals')


// Main templates
import "/imports/ui/layouts/layout.js"
import "/imports/ui/shared/error-404/error-404.js"
import "/imports/ui/shared/footer/footer.js"
import "/imports/ui/shared/header/header.js"
import "/imports/ui/shared/sidebar/sidebar.js"
import "/imports/ui/shared/breadcrumb/breadcrumb.js"
import "/imports/ui/shared/empty-result/empty-result.js"
import "/imports/ui/shared/loader/loader.js"