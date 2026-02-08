import type { ApiClient } from './client';

export class MockApiClient implements ApiClient {
  public readonly baseUrl = 'mock://local';

  async getHealth(): Promise<{ status: string; version: string }> {
    throw new Error(`MockApiClient: method 'getHealth' is not implemented`);
  }

  async listProjects(): Promise<any> {
    throw new Error(`MockApiClient: method 'listProjects' is not implemented`);
  }

  async createProject(): Promise<any> {
    throw new Error(`MockApiClient: method 'createProject' is not implemented`);
  }

  async getProject(): Promise<any> {
    throw new Error(`MockApiClient: method 'getProject' is not implemented`);
  }

  async updateProject(): Promise<any> {
    throw new Error(`MockApiClient: method 'updateProject' is not implemented`);
  }

  async deleteProject(): Promise<any> {
    throw new Error(`MockApiClient: method 'deleteProject' is not implemented`);
  }

  async getProjectStatus(): Promise<any> {
    throw new Error(`MockApiClient: method 'getProjectStatus' is not implemented`);
  }

  async buildProject(): Promise<any> {
    throw new Error(`MockApiClient: method 'buildProject' is not implemented`);
  }

  async search(): Promise<any> {
    throw new Error(`MockApiClient: method 'search' is not implemented`);
  }

  async assembleContext(): Promise<any> {
    throw new Error(`MockApiClient: method 'assembleContext' is not implemented`);
  }

  async getTraceStatus(): Promise<any> {
    throw new Error(`MockApiClient: method 'getTraceStatus' is not implemented`);
  }

  async getProjectRoots(): Promise<any> {
    throw new Error(`MockApiClient: method 'getProjectRoots' is not implemented`);
  }

  async getProjectFileContent(): Promise<any> {
    throw new Error(`MockApiClient: method 'getProjectFileContent' is not implemented`);
  }

  async startWatch(): Promise<any> {
    throw new Error(`MockApiClient: method 'startWatch' is not implemented`);
  }

  async stopWatch(): Promise<any> {
    throw new Error(`MockApiClient: method 'stopWatch' is not implemented`);
  }

  async getWatchStatus(): Promise<any> {
    throw new Error(`MockApiClient: method 'getWatchStatus' is not implemented`);
  }

  async getLLMStatus(): Promise<any> {
    throw new Error(`MockApiClient: method 'getLLMStatus' is not implemented`);
  }
}

export const createMockApiClient = (): ApiClient => new MockApiClient();
