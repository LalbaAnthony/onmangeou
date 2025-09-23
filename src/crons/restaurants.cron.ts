import { restaurantService } from '../services/restaurant.service';
import cron from 'node-cron';

const restaurantCron = cron.schedule('0 2 * * *', () => { // every day at 2:00 AM
    console.log('Cron job executed: Truncating restaurants data');
    restaurantService.truncate();
});

restaurantCron.start();

export default restaurantCron;