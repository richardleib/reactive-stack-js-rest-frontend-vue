import _ from 'lodash';
import {reactive} from 'vue';
import {filter} from 'rxjs/operators';

import ClientSocket from '../client.socket';

const _isValidMessage = (targets, message) => {
	const {type, target} = message;
	return 'update' === type && _.includes(_.keys(targets), target);
};

export default class ReactiveStore {
	_name;
	_subscription;
	_targets;
	_store;

	constructor(name) {
		this._name = name;
	}

	sendSubscribe(target, config) {
		console.log('sendSubscribe', {target, config});
		const {observe, scope} = this._targets[target];
		if (!observe || !scope) return;
		ClientSocket.sendSubscribe({target, observe, scope, config});
	}

	sendUnsubscribe(target) {
		ClientSocket.sendUnsubscribe({target});
	}

	// TODO: refactor
	async init(storeTargets) {
		if (this._subscription) this.destroy();

		const targets = storeTargets.targets;
		if (!_.isPlainObject(targets)) {
			throw new Error('Invalid targets! Expected plain object with attributes and initial values.');
		}
		this._targets = targets;

		const targetKeys = _.keys(this._targets);
		_.each(targetKeys, (key) => {
			const initial = _.get(this._targets, key + '.initial', false);
			_.set(this._targets, key + '.scope', 'one');
			if (_.isArray(initial)) _.set(this._targets, key + '.scope', 'many');
		});

		this._store = null;
		const store = {};
		_.each(this._targets, (value, key) => {
			const {initial} = value;
			_.set(store, key, initial);
			if (_.isArray(initial)) _.set(store, key + 'Count', 0);
		});
		this._store = reactive(store);

		let clientSocket = await ClientSocket.init();
		this._subscription = clientSocket //
			.pipe(filter((message) => _isValidMessage(this._targets, message)))
			.subscribe({
				next: (message) => this._process(message),
				error: (err) => console.log('error', err),
				complete: () => console.log('completed')
			});
		console.log(this._name, 'initialized.');

		return this._store;
	}

	getStore() {
		return this._store;
	}

	destroy() {
		this._subscription.unsubscribe();
		this._subscription = null;
		this._store = null;
		console.log(this._name, 'destroyed.');
	}

	_process(message) {
		const {target, payload} = message;
		const {scope} = this._targets[target];
		if (!scope) return;

		_.set(this._store, target, payload[target]);
		if (scope === 'many') _.set(this._store, target + 'Count', payload['_' + target + 'Count']);
	}
}
