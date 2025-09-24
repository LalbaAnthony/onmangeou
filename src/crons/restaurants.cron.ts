import { restaurantService } from '../services/restaurant.service';
import { fingerprint } from '../utils/fingerprint.utils';
import cron from 'node-cron';

const restaurantCron = cron.schedule('0 6 * * *', () => { // every day at 6:00 AM
    console.log('Cron job executed: Truncating restaurants data');
    restaurantService.truncate();
    fingerprint.clear();
});

restaurantCron.start();

export default restaurantCron;