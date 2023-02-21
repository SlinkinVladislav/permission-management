const _ = require('lodash');

class RightsModule {
  url: string;
  constructor(url: string) {
    this.url = url
  }
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.url);
      const data = await response.text();
      console.log(data);
      return true;
    } catch (e) {
      return false;
    }
  }
}

async function sendQueryRequest(query: string, jwt?: string): Promise<Record<string, any>> {
  const response = await fetch(`http://localhost:3000/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authorization': `${jwt ? 'Bearer ' + jwt: undefined}`
    },
    body: JSON.stringify({
      query
    }),
  });
  return response.json();
}

async function getProductToken(product: string, password: string): Promise<string> {
  const response = await sendQueryRequest(`{
    loginProduct(payload: {
      product: "${product}",
      password: "${password}"
    }){
      access_token
      expiresIn
    }
  }`)
  return response?.data?.loginProduct?.access_token;
}

async function getPermissionsForUser(token: string, user: string): Promise<any> {
  const response = await sendQueryRequest(`{
    getUserRights(userId: "${user}"){
      roles{
        permissions{
          action{
            name
          }
          object{
            name
          }
        }
      }
    }
  }`, token)
  return response?.data?.getUserRights?.roles;
}

async function can(
  action: string, 
  object: string, 
  user: string, 
  product: string, 
  password: string
): Promise<boolean> {
  const token = await getProductToken(product, password)
  if (!token) {
    return false;
  }

  const rights = await getPermissionsForUser(token, user);
  const permissions = _.get(rights, '[0].permissions', []);
  if (permissions.length === 0) {
    return false
  }
  return permissions.some((el: Record<string, any>) => el.action.name === action && el.object.name === object)
}

can('read', 'role', 'bc3b8d31-bd64-43d8-9559-3553394906f1', 'e4818fdf-7c53-4fe0-8371-257e0b7810a5', '111');

export { RightsModule };