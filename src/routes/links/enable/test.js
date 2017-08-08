import enable from './';

import sinon from 'sinon';
import assert from 'assert';

// Helper for mounting routes in an express app and querying them.
// import db from '../../test-helpers/create-database-model-instances';
import issueRequest from '../../../test-helpers/issue-request';
import MockModel from '../../../test-helpers/mock-model';

const User = new MockModel(),
      Link = new MockModel([], {owner: User});

Link.methods.display = function() { return this; }

describe('link enable', () => {
  let user, user2, link, link2;

  beforeEach(async function() {
    user = await User.create({username: 'ryan'});
    user2 = await User.create({username: 'bill'});

    link = await Link.create({
      name: 'My Link',
      enabled: true,
      owner: user.id,
    });
    link2 = await Link.create({
      name: 'My non-owned Link',
      enabled: true,
      owner: user2.id,
    });
  });

  it('should enable a link for a user', () => {
    const enabledState = !link.enabled;
    return issueRequest(
      enable, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/${link.id}`,
        json: true,
        body: {
          enabled: enabledState,
        },
      }
    ).then(res => {
      assert.equal(res.statusCode, 200);
      return Link.findOne({where: {id: link.id}});
    }).then(link => {
      assert.equal(link.enabled, enabledState);
    });
  });
  it('should try to enable a link, but fail with a malformed body', () => {
    const enabledState = !link.enabled;
    return issueRequest(
      enable, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/${link.id}`,
        json: true,
        body: {
          no: 'enabled',
          property: 'here',
        },
      }
    ).then(res => {
      assert.equal(res.body.error, `Enabled property not specified in the body.`);
    });
  });
  it('should try to enable a link, but should fail with a bad link id', () => {
    const enabledState = !link.enabled;
    return issueRequest(
      enable, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/32542542y52451311341`, // Bogus link id
        json: true,
        body: {
          enabled: enabledState,
        },
      }
    ).then(res => {
      assert.equal(res.body.error, 'No such link.');
    });
  });
  it(`should try to enable a link, but should fail when the link isn't owned by the current user.`, () => {
    const enabledState = !link2.enabled;
    return issueRequest(
      enable, [Link],
      '/:linkId', user, {
        method: 'PUT',
        url: `/${link2.id}`, // Bogus link id
        json: true,
        body: {
          enabled: enabledState,
        },
      }
    ).then(res => {
      assert.equal(res.body.error, 'No such link.');
    });
  });
});
