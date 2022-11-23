/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {
  // Profile
  Route.get('/profile', 'UsersController.profile')
  Route.put('/profile', 'UsersController.profileUpdate')
  // Trackers
  Route.get('/trackers', 'TrackersController.index')
  Route.post('/trackers/preassign', 'TrackersController.preassign')
  Route.post('/trackers/assign', 'TrackersController.assign')
  Route.post('/trackers/unassign', 'TrackersController.unassign')
  Route.put('/trackers', 'TrackersController.update')
  Route.get('/trackers/show', 'TrackersController.show')
  // GeoFences
  Route.get('/geo-fences', 'GeoFencesController.index')
  Route.post('/geo-fences', 'GeoFencesController.store')
  Route.put('/geo-fences', 'GeoFencesController.update')
  Route.delete('/geo-fences', 'GeoFencesController.destroy')
  Route.get('/geo-fences/show', 'GeoFencesController.show')
  // Chats
  Route.get('/chats', 'ChatsController.index')
  Route.get('/chats/messages', 'ChatsController.showMessages')
  Route.post('/chats/messages', 'ChatsController.sendMessage')
  Route.post('/chats/read-all', 'ChatsController.readAll')
}).middleware('iauth')

Route.group(() => {
  Route.get('/trackers', 'AdminsController.indexTrackers')
  Route.post('/trackers', 'AdminsController.storeTracker')
  Route.put('/trackers', 'AdminsController.updateTracker')
  Route.delete('/trackers', 'AdminsController.destroyTracker')
  Route.get('/users', 'AdminsController.indexUsers')
}).prefix('admin').middleware('iauth')
