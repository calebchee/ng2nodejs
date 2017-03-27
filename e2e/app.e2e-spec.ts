import { NodeTokenJwtPage } from './app.po';

describe('node-token-jwt App', function() {
  let page: NodeTokenJwtPage;

  beforeEach(() => {
    page = new NodeTokenJwtPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
