import {Router} from 'express'
import {loginUser, logoutUser, registerUser} from '../controllers/user.js'
import { verifyJWT } from '../middlewares/Auth.js'
import { upload } from '../middlewares/multer.js'

const router = Router()

router.route("/register").post(
    //middleware
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    //route to controller
    registerUser
)

router.route("/login").post(loginUser)

//Secured routes
router.route("logout").post(verifyJWT, logoutUser)
export default router