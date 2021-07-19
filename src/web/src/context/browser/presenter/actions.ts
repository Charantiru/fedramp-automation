import type { PresenterConfig } from '.';
import * as router from './router';

export const onInitializeOvermind = ({ actions, effects }: PresenterConfig) => {
  actions.setCurrentRoute(window.location.hash);
  effects.locationListen(url => {
    actions.setCurrentRoute(url);
  });
  window.addEventListener('hashchange', event => {
    const url = event.newURL.split('#')[1];
    actions.setCurrentRoute(url);
  });
};

export const setCurrentRoute = ({ state }: PresenterConfig, url: string) => {
  const route = router.getRoute(url);
  if (route.type !== 'NotFound') {
    state.currentRoute = route;
  }
};

export const getAssetUrl = ({ state }: PresenterConfig, assetPath: string) => {
  return `${state.baseUrl}/${assetPath}`;
};
