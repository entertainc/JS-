// 1. Promise有三个状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function resolveP(p2, x, resolve, reject) {
	if (p2 === x) {
		return reject(
			new TypeError('Chaining cycle detected for promise #<Promise>')
		);
	}

	let called = false;
	if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
		let then = x.then;
		if (typeof then === 'function') {
			then.call(
				x,
				(res) => {
					if (called) return;
					called = true;
					resolveP(p2, res, resolve, reject);
				},
				(err) => {
					if (called) return;
					called = true;
					reject(err);
				}
			);
		} else {
			resolve(x);
		}
	} else {
		resolve(x);
	}
}
// 2.Promise传入一个函数作为参数，并且传入的函数会立即执行
class P {
	constructor(executor) {
		this.status = PENDING;
		this.value = undefined;
		this.reason = undefined;
		this.onResolvedCallbacks = [];
		this.onRejectedCallbacks = [];

		let resolve = (value) => {
			if (this.status === PENDING) {
				this.status = FULFILLED;
				this.value = value;
				this.onResolvedCallbacks.forEach((fn) => fn());
			}
		};

		let reject = (reason) => {
			if (this.status === PENDING) {
				this.status = REJECTED;
				this.reason = reason;
				this.onRejectedCallbacks.forEach((fn) => fn());
			}
		};

		try {
			executor(resolve, reject);
		} catch (error) {
			reject(error);
		}
	}

	then(onFulfilled, onRejected) {
		//解决 onFufilled，onRejected 没有传值的问题
		//Promise/A+ 2.2.1 / Promise/A+ 2.2.5 / Promise/A+ 2.2.7.3 / Promise/A+ 2.2.7.4
		onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (v) => v;
		//因为错误的值要让后面访问到，所以这里也要跑出个错误，不然会在之后 then 的 resolve 中捕获
		onRejected =
			typeof onRejected === 'function'
				? onRejected
				: (err) => {
						throw err;
				  };
		// 每次调用 then 都返回一个新的 promise  Promise/A+ 2.2.7
		let promise2 = new Promise((resolve, reject) => {
			if (this.status === FULFILLED) {
				//Promise/A+ 2.2.2
				//Promise/A+ 2.2.4 --- setTimeout
				setTimeout(() => {
					try {
						//Promise/A+ 2.2.7.1
						let x = onFulfilled(this.value);
						// x可能是一个proimise
						resolveP(promise2, x, resolve, reject);
					} catch (e) {
						//Promise/A+ 2.2.7.2
						reject(e);
					}
				}, 0);
			}

			if (this.status === REJECTED) {
				//Promise/A+ 2.2.3
				setTimeout(() => {
					try {
						let x = onRejected(this.reason);
						resolveP(promise2, x, resolve, reject);
					} catch (e) {
						reject(e);
					}
				}, 0);
			}

			if (this.status === PENDING) {
				this.onResolvedCallbacks.push(() => {
					setTimeout(() => {
						try {
							let x = onFulfilled(this.value);
							resolveP(promise2, x, resolve, reject);
						} catch (e) {
							reject(e);
						}
					}, 0);
				});

				this.onRejectedCallbacks.push(() => {
					setTimeout(() => {
						try {
							let x = onRejected(this.reason);
							resolveP(promise2, x, resolve, reject);
						} catch (e) {
							reject(e);
						}
					}, 0);
				});
			}
		});

		return promise2;
	}
}

P.defer = P.deferred = function () {
	let dfd = {};
	dfd.promise = new P((resolve, reject) => {
		dfd.resolve = resolve;
		dfd.reject = reject;
	});
	return dfd;
};

module.exports = P;
