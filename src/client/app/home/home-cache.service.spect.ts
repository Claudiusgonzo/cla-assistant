import { beforeEachProviders, inject, async, fakeAsync, tick } from '@angular/core/testing';
import { provide } from '@angular/core';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Http, Response, ResponseOptions, ResponseType } from '@angular/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { getHttpMockServices, setupFakeConnection } from '../test-utils/http';

import { HomeCacheService } from './home-cache.service';
import { GithubService } from '../shared/github/github.service';


const fakeGithubData = {
  user: { login: 'testUser' },
  gists: [{ name: 'gist1' }, { name: 'gist2' }],
  repos: [{ fullName: 'repo1' }, { fullName: 'repo2' }]
};
function createGithubServiceMock() {
  return jasmine.createSpyObj('GithubSeriveMock', [
    'getUser',
    'getUserGists',
    'getUserRepos'
  ]);
}
function createRouterMock() {
  return jasmine.createSpyObj('RouterMock', ['navigate']);
}

describe('Home Cache Service', () => {
  let githubServiceMock;
  let routerMock;
  let mockBackend: MockBackend;
  let homeCacheService: HomeCacheService;

  beforeEachProviders(() => [
    ...getHttpMockServices()
  ]);

  beforeEach(inject([Http, MockBackend], (http, mb) => {
    githubServiceMock = createGithubServiceMock();
    routerMock = createRouterMock();
    homeCacheService = new HomeCacheService(githubServiceMock, routerMock, http);
    mockBackend = mb;
  }));

  it('should redirect to login page when request returns with status code 401', fakeAsync(() => {
    githubServiceMock.getUser.and.returnValue(Observable.throw({ status: 401}));
    const spy = jasmine.createSpy('observer');
    homeCacheService.currentUser.subscribe(spy);
    tick();
    expect(spy.calls.count()).toEqual(0);
    expect(routerMock.navigate).toHaveBeenCalledWith(['login']);
  }));

  describe('defaultGists', () => {
    it('should return the default CLAs', async(() => {
      const expectedUrl = '/static/cla-assistant.json';
      const expectedResponse = [
        {
          name: 'SAP individual CLA',
          url: 'https://gist.github.com/CLAassistant/bd1ea8ec8aa0357414e8'
        }];
      const fakeResponseBody = {};
      fakeResponseBody['default-cla'] = expectedResponse;

      setupFakeConnection(mockBackend, {
        expectedUrl,
        fakeResponseBody
      });
      homeCacheService.defaultGists.subscribe((result) => {
        expect(result).toEqual(expectedResponse);
      });
    }));
  });

  describe('currentUser', () => {
    it('it should get the current user from the github serive and cache the result', () => {
      githubServiceMock.getUser.and.returnValue(Observable.of(fakeGithubData.user));
      homeCacheService.currentUser.subscribe((user) => {
        expect(user).toBe(fakeGithubData.user);
      });
      expect(githubServiceMock.getUser).toHaveBeenCalledTimes(1);
      // Second time should be cached and not call the github service again
      homeCacheService.currentUser.subscribe((user) => {
        expect(user).toBe(fakeGithubData.user);
      });
      expect(githubServiceMock.getUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('currentUserGists', () => {
    it('it should get the current user\'s gists from the github serive and cache the result', () => {
      githubServiceMock.getUserGists.and.returnValue(Observable.of(fakeGithubData.gists));
      homeCacheService.currentUserGists.subscribe((gist) => {
        expect(gist).toBe(fakeGithubData.gists);
      });
      expect(githubServiceMock.getUserGists).toHaveBeenCalledTimes(1);
      // Second time should be cached and not call the github service again
      homeCacheService.currentUserGists.subscribe((gist) => {
        expect(gist).toBe(fakeGithubData.gists);
      });
      expect(githubServiceMock.getUserGists).toHaveBeenCalledTimes(1);
    });
  });

  describe('currentUserRepos', () => {
    it('it should get the current user\'s repos from the github serive and cache the result', () => {
      githubServiceMock.getUserRepos.and.returnValue(Observable.of(fakeGithubData.repos));
      homeCacheService.currentUserRepos.subscribe((repos) => {
        expect(repos).toBe(fakeGithubData.repos);
      });
      expect(githubServiceMock.getUserRepos).toHaveBeenCalledTimes(1);
      // Second time should be cached and not call the github service again
      homeCacheService.currentUserRepos.subscribe((repos) => {
        expect(repos).toBe(fakeGithubData.repos);
      });
      expect(githubServiceMock.getUserRepos).toHaveBeenCalledTimes(1);
    });
  });
});
