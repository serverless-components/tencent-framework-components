'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
  const {
    router,
    controller,
    config: { apiPrefix }
  } = app
  router.get('/', controller.home.index)
  router.get('/event', controller.home.event)

  router.get('/user', controller.user.list)
}
