import ReactiveStore from '@/_reactivestack/store/reactive.store';

export default class LocalStore {
	static _instance;

	static async init(storeTargets) {
		if (!LocalStore._instance) LocalStore._instance = new ReactiveStore('LocalStore');
		await LocalStore._instance.init(storeTargets);
		return LocalStore._instance;
	}

	static addTarget(name, collection, initial) {
		LocalStore._instance.addTarget(name, collection, initial);
	}

	static removeTarget(name) {
		LocalStore._instance.removeTarget(name);
	}

	static updateSubscription(target, config) {
		LocalStore._instance.updateSubscription(target, config);
	}

	static closeSubscription(target) {
		LocalStore._instance.closeSubscription(target);
	}

	static getStore() {
		return LocalStore._instance.getStore();
	}

	static destroy() {
		LocalStore._instance.destroy();
	}
}
