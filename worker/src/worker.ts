import { AnimePahe } from './reqeusts';
import { Proxy } from './proxy';
import { Env, WorkerResponse } from './config';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const userAgent = request.headers.get('user-agent')
		
		const { searchParams, pathname } = new URL(request.url)

		const method = searchParams.get('method')
		const session = searchParams.get('session')

		switch (pathname) {
			case '/proxy': {
				return Proxy(request, env, ctx);
			}
		}

		if (!userAgent) {
			return WorkerResponse({ userAgent: false }, 'application/json')
		}

		if (!method) {
			return WorkerResponse({
				session: 'ANIME ID',
				method: 'METHOD - (series | episode | search | airing)',
				page: 'PAGE NO (Required with series/airing method)',
				ep: 'EPIsode ID'
			}, 'application/json')
		}

		try {
			switch (method) {
				case 'series': {
					let page = searchParams.get('page') as string | false
					if (!page) { page = false }
					if (!session) {
						return WorkerResponse({ status: false }, 'application/json')
					}

					const Pahe = new AnimePahe(session, userAgent)
					const response = await Pahe.Episodes(page)
					return WorkerResponse(response, 'application/json')
				}

				case 'episode': {
					let ep = searchParams.get('ep') as string | false
					if (!ep || !session) {
						return WorkerResponse({ status: false }, 'application/json')
					}
					
					const Pahe = new AnimePahe(session, userAgent)
					const epdata = await Pahe.Links(ep)
					return WorkerResponse(epdata, 'application/json')
				}

				case 'search': {
					let query = searchParams.get('query') as string | false
					if (!query) {
						return WorkerResponse({ status: false }, 'application/json')
					}
					const result = await AnimePahe.search(query, userAgent)
					return WorkerResponse(result, 'application/json')
				}

                case 'airing': {
                    let page = searchParams.get('page') as string
                    const result = await AnimePahe.airing(page, userAgent)
                    return WorkerResponse(result, 'application/json')
                }

				default: {
					return WorkerResponse({ status: false }, 'application/json')
				}
			}
		} catch (error) {
			return WorkerResponse({ status: false }, 'application/json')
		}
	},
};
