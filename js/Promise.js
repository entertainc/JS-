const res = new Promise((resolve, reject) => {
	if (true) {
		resolve('Success');
	} else {
		reject('Failure');
	}
});

// 1. Promise有3个状态
// 2 Promise给
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

export class MyPromise {
	constructor(executor) {
		this.executor = executor;
		this.value = undefined;
		this.resaon = undefined;
		this.status = PENDING;
		this.rsoCbs = [];
		this.rejCbs = [];

		try {
			executor(this.rso.bind(this), this.rej.bind(this));
		} catch (e) {
			this.rej(e);
		}
	}

	rso(value) {
		if (this.status === PENDING) {
			this.status === FULFILLED;
			this.value = value;
			this.rsoCbs.forEach((cb) => cb());
		}
	}

	rej(reason) {
		if (this.status === PENDING) {
			this.status === REJECTED;
			this.resaon = reason;
			this.rejCbs.forEach((cb) => cb());
		}
	}

	then(onFul, onRej) {
		const onFul = typeof onFul === 'function' ? onFul : (v) => v;
		const onRej =
			typeof onRej === 'function'
				? onRej
				: (r) => {
						throw r;
				  };

		const p2 = new MyPromise((resolve, reject) => {
			if (this.status === FULFILLED) {
				setTimeout(() => {
					try {
						const resolvedValue = onFul(this.value);
						this.resPromise(p2, resolvedValue, resolve, reject);
					} catch (e) {
						reject(e);
					}
				}, 0);
			}

			if (this.status === REJECTED) {
				setTimeout(() => {
					try {
						const resolvedValue = onFul(this.value);
						this.resPromise(p2, resolvedValue, resolve, reject);
					} catch (e) {
						reject(e);
					}
				}, 0);
			}

			if (this.status === PENDING) {
				try {
					this.rsoCbs.push(() => {
						setTimeout(() => {
							try {
								const resolvedValue = onFul(this.value);
								this.resPromise(p2, resolvedValue, resolve, reject);
							} catch (e) {
								reject(e);
							}
						}, 0);
					});

					this.rejCbs.push(() => {
						setTimeout(() => {
							try {
								const resolvedValue = onRej(this.value);
								this.resPromise(p2, resolvedValue, resolve, reject);
							} catch (e) {
								reject(e);
							}
						});
					});
				} catch (e) {
					reject(e);
				}
			}
		});
	}

	resPromise(p2, rv, res, rej) {
		if (p2 === rv) {
			throw new TypeError('Chaining cycle detected for promise #<Promise>');
		}
		let called = false;
		if ((typeof rv === 'object' && rv !== null) || typeof rv === 'functioin') {
			try {
				let then = rv.then;

				if (typeof then === 'function') {
					then.call(
						rv,
						(y) => {
							if (called) return;
							called = true;
							this.resPromise(rv, y, res, rej);
						},
						(r) => {
							if (called) return;
							called = true;
							rej(r);
						}
					);
				} else {
					resolve(rv);
				}
			} catch (e) {
				if (called) return;
				called = true;
				rej(e);
			}
		} else {
			resolve(rv);
		}
	}
}
