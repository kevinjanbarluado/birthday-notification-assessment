import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { UserController } from './controllers/UserController';
import { validateRequest, validateParams, createUserSchema, updateUserSchema, userIdSchema } from './middleware/validation';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export class App {
  public app: express.Application;
  private userController: UserController;

  constructor() {
    this.app = express();
    this.userController = new UserController();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: express.Request, res: express.Response) => {
      res.json({
        success: true,
        message: 'Service is healthy',
        timestamp: new Date().toISOString(),
      });
    });

    // User routes
    this.app.post(
      '/user',
      validateRequest(createUserSchema),
      this.userController.createUser.bind(this.userController)
    );

    this.app.put(
      '/user/:id',
      validateParams(userIdSchema),
      validateRequest(updateUserSchema),
      this.userController.updateUser.bind(this.userController)
    );

    this.app.delete(
      '/user/:id',
      validateParams(userIdSchema),
      this.userController.deleteUser.bind(this.userController)
    );

    this.app.get(
      '/user/:id',
      validateParams(userIdSchema),
      this.userController.getUser.bind(this.userController)
    );
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}
