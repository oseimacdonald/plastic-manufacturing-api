// tests/setup.js - Complete mongoose mock for testing
process.env.NODE_ENV = 'test';

// Mock mongoose BEFORE anything imports it
jest.mock('mongoose', () => {
  // Create a proper mongoose mock that won't fail on Schema.Types.ObjectId
  class MockSchema {
    constructor(obj, options) {
      return this;
    }
    
    // Add schema methods
    index() { return this; }
    pre() { return this; }
    post() { return this; }
    static Types = {
      ObjectId: function ObjectId() { return this; }
    };
  }

  return {
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      db: { databaseName: 'test' },
      on: jest.fn(),
      once: jest.fn(),
      close: jest.fn()
    },
    Schema: MockSchema,
    SchemaTypes: {
      ObjectId: function() { return this; }
    },
    model: jest.fn().mockImplementation((modelName) => {
      // Return a generic mock model
      const mockModel = {
        find: jest.fn().mockResolvedValue([]),
        findById: jest.fn().mockResolvedValue(null),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
        save: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
        findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
        findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
        countDocuments: jest.fn().mockResolvedValue(0),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };
      
      return mockModel;
    }),
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => {
        if (id) return { toString: () => id };
        return { toString: () => '507f1f77bcf86cd799439011' };
      })
    }
  };
});

// Mock console
let consoleSpies = {};

beforeAll(() => {
  consoleSpies.log = jest.spyOn(console, 'log').mockImplementation(() => {});
  consoleSpies.error = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleSpies.warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  consoleSpies.log.mockRestore();
  consoleSpies.error.mockRestore();
  consoleSpies.warn.mockRestore();
});