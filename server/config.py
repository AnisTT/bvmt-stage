class Config(object):
    DEBUG = False
    TESTING = False
    secret_key = 'your-secret-key'
    

    DATABASE_URI = 'sqlite:///inve.db'

class ProductionConfig(Config):
    DATABASE_URI = 'mysql://user@localhost/foo'

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True