import express from 'express';
import morgan from 'morgan';
import helloRoutes from '@routes/helloRoutes';

const app = express();
const port = process.env.EXPRESS_PORT || 3000;

// Does logging
app.use(morgan('combined'));

app.use('/hello', helloRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
