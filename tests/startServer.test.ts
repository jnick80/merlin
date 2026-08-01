describe('startServer', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    delete process.env.DB_PASSWORD;
  });

  it('starts the server even when the database is unavailable', async () => {
    const connect = jest.fn().mockRejectedValue(new Error('DB_PASSWORD environment variable is required'));
    const getInstance = jest.fn(() => ({ connect }));
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      http: jest.fn(),
      debug: jest.fn()
    };

    jest.doMock('../src/database/connection', () => ({
      Database: { getInstance }
    }));
    jest.doMock('../src/utils/logger', () => ({
      logger
    }));

    await jest.isolateModulesAsync(async () => {
      const { default: app, startServer } = await import('../src/index');
      const listenSpy = jest.spyOn(app, 'listen').mockImplementation(((_port: number | string, callback?: () => void) => {
        callback?.();
        return {} as never;
      }) as typeof app.listen);
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((_code?: number) => undefined as never) as typeof process.exit);

      await expect(startServer()).resolves.toBeUndefined();

      expect(getInstance).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledTimes(1);
      expect(listenSpy).toHaveBeenCalledTimes(1);
      expect(exitSpy).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Database unavailable, starting without database connection',
        expect.objectContaining({
          message: 'DB_PASSWORD environment variable is required'
        })
      );
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Merlin Business OS running on port'));
    });
  });
});
