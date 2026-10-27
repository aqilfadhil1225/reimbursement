import 'dotenv/config';
import app from './src/app';
import config from './src/config';

void config.jwtSecret;

app.listen(config.port, () => {
  console.log(`${config.appName} running on port ${config.port}`);
});
