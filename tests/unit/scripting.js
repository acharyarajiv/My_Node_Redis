exports.Scripting = (function () {
	// private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	server1 = new Server(),
	server2 = new Server(),
	server3 = new Server(),
	server4 = new Server(),
	scripting = {},
	name = "Scripting",
	client = "",
	tester = {},
	server_pid = "",
	all_tests = "",
	server_host = "",
	server_port = "",
	client_pid = "";

	//public property
	scripting.debug_mode = false;

	scripting.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = "scripting";
			var overrides = {};
			var args = {};
			args['name'] = name;
			args['tags'] = tags;
			args['overrides'] = overrides;
			server.start_server(client_pid, args, function (err, res) {
				if (err) {
					callback(err, null);
				}
				server_pid = res;
				client = g.srv[client_pid][server_pid]['client'];
				server_host = g.srv[client_pid][server_pid]['host'];
				server_port = g.srv[client_pid][server_pid]['port'];
				all_tests = Object.keys(tester);

				testEmitter.emit('next');
			});
		});
		testEmitter.on('end', function () {
			server.kill_server(client_pid, server_pid, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			});
		});
		testEmitter.on('next', function () {
			var test_case_name = all_tests.shift()
				if (test_case_name) {
					tester[test_case_name](function (error) {
						ut.fail(error);
						testEmitter.emit('next');
					});
				} else {
					client.end();
					if (scripting.debug_mode) {
						log.notice(name + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		if (scripting.debug_mode) {
			server.set_debug_mode(true);
		}
		testEmitter.emit('start');
	}

	tester.scripting1 = function (errorCallback) {
		var test_case = "EVAL - Does Lua interpreter replies to our requests?";
		client.eval("return 'hello'", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'hello', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting2 = function (errorCallback) {
		var test_case = "EVAL - Lua integer -> Redis protocol type conversion";
		client.eval("return 100.5", 0, function (err, res) {
			try {
				if (!assert.equal(res, '100', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting3 = function (errorCallback) {
		var test_case = "EVAL - Lua string -> Redis protocol type conversion";
		client.eval("return 'hello world'", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'hello world', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting4 = function (errorCallback) {
		var test_case = "EVAL - Lua true boolean -> Redis protocol type conversion";
		client.eval("return true", 0, function (err, res) {
			try {
				if (!assert.equal(res, '1', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting5 = function (errorCallback) {
		var test_case = "EVAL - Lua false boolean -> Redis protocol type conversion";
		client.eval("return false", 0, function (err, res) {
			try {
				if (!assert.equal(res, null, test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting6 = function (errorCallback) {
		var test_case = "EVAL - Lua status code reply -> Redis protocol type conversion";
		client.eval("return {ok='fine'}", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'fine', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting7 = function (errorCallback) {
		var test_case = "EVAL - Lua error reply -> Redis protocol type conversion";
		client.eval("return {err='this is an error'}", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('this is an error', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting8 = function (errorCallback) {
		var test_case = "EVAL - Lua table -> Redis protocol type conversion";
		client.eval("return {1,2,3,'ciao',{1,2}}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, [1, 2, 3, 'ciao', [1, 2]], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting9 = function (errorCallback) {
		var test_case = "EVAL - Are the KEYS and ARGS arrays populated correctly?";
		client.eval("return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}", 2, 'a', 'b', 'c', 'd', function (err, res) {
			try {
				if (!assert.deepEqual(res, ['a', 'b', 'c', 'd'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting10 = function (errorCallback) {
		var test_case = "EVAL - is Lua able to call Redis API?";
		client.set('mykey', 'myval');
		client.eval("return redis.call('get','mykey')", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'myval', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting11 = function (errorCallback) {
		var test_case = "EVALSHA - Can we call a SHA1 if already defined?";
		client.evalsha("9bd632c7d33e571e9f24556ebed26c3479a87129", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'myval', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting12 = function (errorCallback) {
		var test_case = "EVALSHA - Can we call a SHA1 in uppercase?";
		client.evalsha("9BD632C7D33E571E9F24556EBED26C3479A87129", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'myval', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting13 = function (errorCallback) {
		var test_case = "EVALSHA - Do we get an error on invalid SHA1?";
		client.evalsha("NotValidShaSUM", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('NOSCRIPT', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting14 = function (errorCallback) {
		var test_case = "EVALSHA - Do we get an error on non defined SHA1?";
		client.evalsha("ffd632c7d33e571e9f24556ebed26c3479a87130", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('NOSCRIPT', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting15 = function (errorCallback) {
		var test_case = "EVAL - Redis integer -> Lua type conversion";
		client.eval("local foo = redis.pcall('incr','x') return {type(foo),foo}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['number', 1], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting16 = function (errorCallback) {
		var test_case = "EVAL - Redis bulk -> Lua type conversion";
		client.set('mykey', 'myval');
		client.eval("local foo = redis.pcall('get','mykey') return {type(foo),foo}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['string', 'myval'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting17 = function (errorCallback) {
		var test_case = "EVAL - Redis multi bulk -> Lua type conversion";
		client.del('mylist');
		client.rpush('mylist', 'a');
		client.rpush('mylist', 'b');
		client.rpush('mylist', 'c');
		client.eval("local foo = redis.pcall('lrange','mylist',0,-1) return {type(foo),foo[1],foo[2],foo[3],# foo}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['table', 'a', 'b', 'c', 3], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting18 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type conversion";

		client.eval("local foo = redis.pcall('set','mykey','myval') return {type(foo),foo['ok']}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['table', 'OK'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting19 = function (errorCallback) {
		var test_case = "EVAL - Redis error reply -> Lua type conversion";
		client.set('mykey', 'myval');
		client.eval("local foo = redis.pcall('incr','mykey') return {type(foo),foo['err']}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['table', 'ERR value is not an integer or out of range'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting20 = function (errorCallback) {
		var test_case = "EVAL - Redis nil bulk reply -> Lua type conversion";
		client.del('mykey');
		client.eval("local foo = redis.pcall('get','mykey') return {type(foo),foo == false}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['boolean', 1], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting21 = function (errorCallback) {
		var test_case = "EVAL - Is Lua affecting the currently selected DB?";
		client.set('mykey', "this is DB 0");
		client.select(10);
		client.set('mykey', "this is DB 10");
		client.eval("return redis.pcall('get','mykey')", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'this is DB 10', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting22 = function (errorCallback) {
		var test_case = "EVAL - Is Lua seleced DB retained?";

		client.eval("return redis.pcall('select','0')", 0, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.get('mykey', function (err, res) {
				try {
					if (!assert.equal(res, 'this is DB 0', test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	if (0) {
		tester.scripting23 = function (errorCallback) {
			var test_case = "EVAL - Script can't run more than configured time limit";
			client.config('set', 'lua-time-limit', 1, function (err, res) {

				client.eval("local i = 0 while false do i=i+1 end", 0, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					try {
						if (!assert.equal(err, 'this is DB 0', test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');

				});
			});
		}
	}

	tester.scripting24 = function (errorCallback) {
		var test_case = "EVAL - Scripts can't run certain commands";

		client.eval("return redis.pcall('spop','x')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('not allowed', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting25 = function (errorCallback) {
		var test_case = "EVAL - Scripts can't run certain commands";

		client.eval("redis.pcall('randomkey'); return redis.pcall('set','x','ciao')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('not allowed after', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting26 = function (errorCallback) {
		var test_case = "EVAL - No arguments to redis.call/pcall is considered an error";

		client.eval("return redis.call()", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('one argument', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting27 = function (errorCallback) {
		var test_case = "EVAL - redis.call variant raises a Lua error on Redis cmd error (1)";

		client.eval("redis.call('nosuchcommand')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('Unknown Redis', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting28 = function (errorCallback) {
		var test_case = "EVAL - redis.call variant raises a Lua error on Redis cmd error (1)";

		client.eval("redis.call('get','a','b','c')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('number of args', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting29 = function (errorCallback) {
		var test_case = "EVAL - redis.call variant raises a Lua error on Redis cmd error (1)";
		client.set('foo', 'bar');
		client.eval("redis.call('lpush','foo','val')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('against a key', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting30 = function (errorCallback) {
		var test_case = "SCRIPTING FLUSH - is able to clear the scripts cache?";
		client.set('mykey', 'myval');

		client.evalsha("9bd632c7d33e571e9f24556ebed26c3479a87129", 0, function (err, res_v) {
			if (res_v == "myval") {
				client.multi([['script', 'flush']]).exec(function (err, res) {
					if (err) {
						errorCallback(err)
					}
					client.evalsha("9bd632c7d33e571e9f24556ebed26c3479a87129", 0, function (err, res_e) {
						try {
							if (!assert.ok(ut.match('NOSCRIPT', err), test_case))
								ut.pass(test_case);
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			} else {
				ut.fail("expected: " + res_v + " Actual: myval", true);
				testEmitter.emit('next');
			}

		});
	}

	tester.scripting31 = function (errorCallback) {
		var test_case = "SCRIPT EXISTS - can detect already defined scripts?";
		client.eval("return 1+1", 0, function (err, res) {
			if (err) {
				errorCallback(err)
			}
			client.multi([['script', 'exists', 'a27e7e8a43702b7046d4f6a7ccf5b60cef6b9bd9', 'a27e7e8a43702b7046d4f6a7ccf5b60cef6b9bda']]).exec(function (err, res) {
				try {
					if (!assert.deepEqual(res, [[1, 0]], test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting32 = function (errorCallback) {
		var test_case = "SCRIPT LOAD - is able to register scripts in the scripting cache";
		var res_array = [];
		client.multi([['script', 'load', "return 'loaded'"]]).exec(function (err, res) {
			if (err) {
				errorCallback(err)
			}
			res_array.push(res);
			client.evalsha("b534286061d4b9e4026607613b95c06c06015ae8", 0, function (err, res) {
				res_array.push(res);
				try {
					if (!assert.deepEqual(res_array, [["b534286061d4b9e4026607613b95c06c06015ae8"], "loaded"], test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting33 = function (errorCallback) {
		var test_case = "In the context of Lua the output of random commands gets ordered";
		client.del('myset');
		client.sadd('myset', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'z', 'aa', 'aaa', 'azz');
		client.eval("return redis.call('smembers','myset')", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['a', 'aa', 'aaa', 'azz', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'z'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting34 = function (errorCallback) {
		var test_case = "SORT is normally not alpha re-ordered for the scripting engine";
		client.del('myset');
		client.sadd('myset', 1, 2, 3, 4, 10);
		client.eval("return redis.call('sort','myset','desc')", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, [10, 4, 3, 2, 1], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting35 = function (errorCallback) {
		var test_case = "SORT BY <constant> output gets ordered for scripting";
		client.del('myset');
		client.sadd('myset', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'z', 'aa', 'aaa', 'azz');
		client.eval("return redis.call('sort','myset','by','_')", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['a', 'aa', 'aaa', 'azz', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'z'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting36 = function (errorCallback) {
		var test_case = "SORT BY <constant> with GET gets ordered for scripting";
		client.del('myset');
		client.sadd('myset', 'a', 'b', 'c');
		client.eval("return redis.call('sort','myset','by','_','get','#','get','_:*')", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['a', null, 'b', null, 'c', null], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting37 = function (errorCallback) {
		var test_case = "redis.sha1hex() implementation";
		var res_array = [];
		client.eval("return redis.sha1hex('')", 0, function (err, res) {
			if (err) {
				errorCallback(err)
			}
			res_array.push(res);
			client.eval("return redis.sha1hex('Pizza & Mandolino')", 0, function (err, res) {
				if (err) {
					errorCallback(err)
				}
				res_array.push(res);
				try {
					if (!assert.deepEqual(res_array, ['da39a3ee5e6b4b0d3255bfef95601890afd80709', '74822d82031af7493c20eefa13bd07ec4fada82f'], test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting38 = function (errorCallback) {
		var test_case = "Globals protection reading an undeclared global variable";

		client.eval("return a", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('attempted to access unexisting global', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting39 = function (errorCallback) {
		var test_case = "Globals protection setting an undeclared global*";

		client.eval("a=10", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('attempted to create global', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting40 = function (errorCallback) {
		var test_case = "Test an example script DECR_IF_GT";
		var script = '\
				local current \
				current = redis.call("get",KEYS[1]) \
				if not current then return nil end \
				if current > ARGV[1] then \
				return redis.call("decr",KEYS[1]) \
				else \
				return redis.call("get",KEYS[1]) \
				end';
		client.set('foo', 5);
		var result = "";
		client.eval(script, 1, 'foo', 2, function (err, res) {
			if (err) {
				errorCallback(err)
			}
			result += res;
			client.eval(script, 1, 'foo', 2, function (err, res) {
				if (err) {
					errorCallback(err)
				}
				result += res;
				client.eval(script, 1, 'foo', 2, function (err, res) {
					if (err) {
						errorCallback(err)
					}
					result += res;
					client.eval(script, 1, 'foo', 2, function (err, res) {
						if (err) {
							errorCallback(err)
						}
						result += res;
						client.eval(script, 1, 'foo', 2, function (err, res) {
							if (err) {
								errorCallback(err)
							}
							result += res;
							try {
								if (!assert.equal(result, 43222, test_case))
									ut.pass(test_case);
							} catch (e) {
								ut.fail(e, true);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	}

	tester.scripting41 = function (errorCallback) {
		var test_case = "Scripting engine resets PRNG at every script execution";
		client.eval("return tostring(math.random())", 0, function (err, res1) {
			if (err) {
				errorCallback(err)
			}
			client.eval("return tostring(math.random())", 0, function (err, res2) {
				if (err) {
					errorCallback(err)
				}
				try {
					if (!assert.equal(res1, res2, test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});

	}

	tester.scripting42 = function (errorCallback) {
		var test_case = "Scripting engine PRNG can be seeded correctly";
		client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 10, function (err, res1) {
			if (err) {
				errorCallback(err)
			}
			client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 10, function (err, res2) {
				if (err) {
					errorCallback(err)
				}
				client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 20, function (err, res3) {
					if (err) {
						errorCallback(err)
					}
					try {
						if (!assert.equal(res1, res2, test_case) && !assert.notEqual(res2, res3, test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});

	}

	tester.scripting43 = function (errorCallback) {
		var tags = "scripting-repl";
		var overrides = {};
		var args = {};
		args['name'] = name;
		args['tags'] = tags;
		server2.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			server_pid1 = res;
			// nesting calls to start_server
			setTimeout(function () { // to give some time for the master to start.
				master_cli = g.srv[client_pid][server_pid1]['client'];
				master_host = g.srv[client_pid][server_pid1]['host'];
				master_port = g.srv[client_pid][server_pid1]['port'];

				var tags = "";
				var overrides = {};
				var args = {};
				args['tags'] = tags;
				args['name'] = name;
				args['overrides'] = overrides;
				server3.start_server(client_pid, args, function (err, res) {
					if (err) {
						errorCallback(err, null);
					}
					server_pid2 = res;
					slave_cli = g.srv[client_pid][server_pid2]['client'];
					start_actual_test(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						slave_cli.end();
						master_cli.end();

						kill_server(function (err, res) {
							if (err) {
								errorCallback(err)
							}
							testEmitter.emit('next');
						});
					});
				});
			}, 100);
		});
		function kill_server(callback) {
			server2.kill_server(client_pid, server_pid1, function (err, res) {
				if (err) {
					callback(err, null);
				} else {
					server3.kill_server(client_pid, server_pid2, function (err, res) {
						if (err) {
							callback(err, null);
						} else if (res) {
							callback(null, true);
						}
					});
				}
			});
		};
		function start_actual_test(callback) {
			async.series({
				one : function (cb) {
					var test_case = "Before the slave connects we issue two EVAL commands";
					slave_cli.eval("redis.call('incr','x'); redis.call('nonexisting')", 0, function (err, res) {
						slave_cli.eval("return redis.call('incr','x')", 0, function (err, res) {
							try {
								if (!assert.equal(res, 2, test_case))
									ut.pass(test_case);
							} catch (e) {
								ut.fail(e, true);
							}
							cb(null, true);
						});
					});
				},
				two : function (cb) {
					var test_case = "Now use EVALSHA against the master, with both SHAs";
					slave_cli.evalsha("6e8bd6bdccbe78899e3cc06b31b6dbf4324c2e56", 0, function (err, res) {

						slave_cli.evalsha('ae3477e27be955de7e1bc9adfdca626b478d3cb2', 0, function (err, res) {
							if (err) {
								cb(err);
							}
							try {
								if (!assert.equal(res, 4, test_case))
									ut.pass(test_case);
							} catch (e) {
								ut.fail(e, true);
							}
							cb(null, true);
						});

					});
				},
				three : function (cb) {
					var test_case = "If EVALSHA was replicated as EVAL, 'x' should be '4'";
					ut.wait_for_condition(50, 100, function (cb) {
						slave_cli.get('x', function (err, res) {
							try {
								if (!assert.equal(res, 4, test_case)) {
									ut.pass(test_case);
									cb(true);
								}
							} catch (e) {
								ut.fail(e, true);
								cb(false);
							}

						});
					}, function () {
						cb(null, null);
					}, function () {
						ut.fail("Expected 4 in x, but value is '[r -1 get x]'", true);
						cb(null, true);
					});
				},
				four : function (cb) {
					var test_case = "Connect a slave to the main instance";
					slave_cli.slaveof(master_host, master_port, function (err, res) {
						if (err) {
							cb(err)
						}
						ut.wait_for_condition(50, 100, function (cb) {
							ut.getserverInfo(slave_cli, function (err, res) {
								if (err) {
									cb(err);
								}
								if (ut.match("role:slave", res) && ut.match("master_link_status:up", res)) {
									ut.pass(test_case);
									cb(true);
								} else {
									cb(false);
								}
							});
						}, function () {
							cb(null, null);
						}, function () {
							cb(new Error("Can't turn the instance into a slave"), null);
						});
					});
				},
			}, function (err, rep) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			});
		};
	};

	tester.scripting44 = function (errorCallback) {
		//Test that the server can be started using the truncated AOF.
		var args = {};
		args['name'] = name;
		args['tags'] = 'scripting';
		args['overrides'] = {};
		var server_host1 = '',
		server_port1 = '',
		server_pid1 = '';
		var KillServer = true;
		server1.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			server_pid1 = res;
			client1 = g.srv[client_pid][server_pid1]['client'];
			server_host1 = g.srv[client_pid][server_pid1]['host'];
			server_port1 = g.srv[client_pid][server_pid1]['port'];
			start_actual_test(function (err, res) {
				if (err) {
					errorCallback(err);
				}
				if (KillServer) {
					kill_server(function (err, res) {
						if (err) {
							errorCallback(err)
						}
					});
				}
			});
		});
		function kill_server(callback) {
			server1.kill_server(client_pid, server_pid1, function (err, res) {
				if (err) {
					callback(err, null);
				}
			});
		};
		function start_actual_test(callback) {
			async.series({
				one : function (async_cb) {
					var test_case = "Timedout read-only scripts can be killed by SCRIPT KILL"
						var newClient = redis.createClient(server_port1, server_host1);

					client1.config('set', 'lua-time-limit', 10);
					newClient.eval('while true do end', 0, function (err, res) {});
					setTimeout(function () {
						client1.ping(function (err, res) {
							try {
								if (!assert.ok(ut.match("BUSY", err)), test_case) {
									client1.script("kill", function (err, res) {
										if (err) {
											callback(err);
										}
										client1.ping(function (err, res) {
											try {
												if (!assert.equal(res, "PONG", test_case))
													ut.pass(test_case)
											} catch (e) {
												ut.fail(e, true)
											}
											newClient.end();
											async_cb(null, false);
										});
									});
								}
							} catch (e) {
								ut.fail(e, true);
								newClient.end();
								async_cb(null, true);
							}
						});
					}, 200);
				},
				two : function (async_cb) {
					var test_case = "Timedout script link is still usable after Lua returns";
					client1.config('set', 'lua-time-limit', 10);
					client1.eval("for i=1,100000 do redis.call('ping') end return 'ok'", 0, function (err, res) {
						client1.ping(function (err, res) {
							try {
								if (!assert.equal(res, "PONG", test_case))
									ut.pass(test_case);
							} catch (e) {
								ut.fail(e, true);
							}
							async_cb(null, true);
						});
					});
				},
				three : function (async_cb) {
					var test_case = "Timedout scripts that modified data can't be killed by SCRIPT KILL";
					var newClient = redis.createClient(server_port1, server_host1);
					newClient.on('error', function (err) {
						newClient.end();
					});
					newClient.eval("redis.call('set','x','y'); while true do end", 0);
					setTimeout(function () {
						client1.ping(function (err, res) {
							try {
								if (!assert.ok(ut.match("BUSY", err)), test_case) {
									client1.script('kill', function (err, res) {
										try {
											if (!assert.ok(ut.match("UNKILLABLE", err)), test_case) {
												client1.ping(function (err, res) {
													try {
														if (!assert.ok(ut.match("BUSY", err)), test_case) {
															ut.pass(test_case);

															test_case = "SHUTDOWN NOSAVE can kill a timedout script anyway";
															client1.write(ut.formatCommand(['shutdown', 'nosave']), function (error, res) {
																if (res) {
																	errorCallback(res);
																}
																newClient1 = redis.createClient(server_port1, server_host1);
																newClient1.on("error", function (msg) {
																	try {
																		if (!assert.ok(ut.match("connect ECONNREFUSED", msg)), test_case)
																			ut.pass(test_case);
																	} catch (e) {
																		ut.fail(e, true);
																	}
																	KillServer = false;
																	client1.end();
																	newClient.end();
																	newClient1.end();
																	testEmitter.emit('next');
																});
															});
														}
													} catch (e) {
														newClient.end();
														ut.fail(e, true);
														async_cb(e);
													}
												});
											}
										} catch (e) {
											newClient.end();
											ut.fail(e, true);
											async_cb(e);
										}
									});
								}
							} catch (e) {
								newClient.end();
								ut.fail(e, true);
								async_cb(e);
							}

						});

					}, 200);
				},
			}, function (err, rep) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			});

		}
	}

	//Increase Code coverage
	tester.scripting45 = function (errorCallback) {
		var test_case = "Shutdown save works";
		var tags = "scripting";
		var overrides = {};
		var args = {};
		args['name'] = name;
		args['tags'] = tags;
		args['overrides'] = overrides;
		server4.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			server_pid1 = res;
			client1 = g.srv[client_pid][server_pid1]['client'];
			server_host = g.srv[client_pid][server_pid1]['host'];
			server_port = g.srv[client_pid][server_pid1]['port'];
			function killserver() {
				server4.kill_server(client_pid, server_pid1, function (err, res) {
					if (err) {
						errorCallback(err, null);
					}
				});
			}

			client1.shutdown('somecommand', function (err, res) {
				try {
					if (!assert.ok(ut.match('syntax error', err), test_case)) {
						client1.shutdown('save', function (err, res) {
							setTimeout(function () {
								var msg = fs.readFileSync(g.srv[client_pid][server_pid1]['stdout']).toString().split('\n');
								var val = msg[msg.length - 4];
								try {
									if (!assert.ok(ut.match('Saving', val), test_case))
										ut.pass(test_case);
								} catch (e) {
									ut.fail(e, true);
								}
								client1.end();
								testEmitter.emit('next');
							}, 500);
						});
					}
				} catch (e) {
					client1.end();
					killserver();
					ut.fail(e, true);
				}
			});
		});
	}

	tester.scripting46 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Syntax Error";

		client.eval("local foo = redis.pcall('set','mykey','myval') return {type(foo),foo['ok}", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('Error', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}
	tester.scripting47 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Unknown command";

		client.eval("local foo = redis.pcall('int.parse(2)')  return {type(foo),foo}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['table', 'Unknown Redis command called from Lua script'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting48 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type tonumber";
		var result_array = [];
		client.eval('return {tonumber(math.random()),tonumber("55"),tonumber(10101.1012e12),tonumber("100110",2),tonumber("LUA", 36),tonumber("55 "),tonumber("100112",2)}', 0, function (err, res) {
			result_array.push(res);
			client.eval('return tonumber("a",50)', 0, function (errB, res) {
				try {
					if (!assert.deepEqual(result_array, [[0, 55, 10101101200000000, 38, 28306, 55]], test_case)
						 && !assert.ok(ut.match('base out of range', errB), test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting49 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type String format";

		client.eval('return string.format("%s %q", "Hello", "Lua user!")', 0, function (err, res1) {
			client.eval('return string.format("%c%c%c", 76,117,97)', 0, function (err, res2) {
				client.eval('return string.format("%e, %E", math.pi,math.pi)', 0, function (err, res3) {
					client.eval('return string.format("%f, %g", math.pi,math.pi)', 0, function (err, res4) {
						client.eval('return string.format("%d, %i, %u", -100,-100,-100)', 0, function (err, res5) {
							client.eval('return string.format("%o, %x, %X", -100,-100,-100)', 0, function (err, res6) {
								try {
									if (!assert.deepEqual(res1, 'Hello "Lua user!"', test_case) && !assert.deepEqual(res2, 'Lua', test_case)
										 && !assert.deepEqual(res3, '3.141593e+000, 3.141593E+000', test_case) && !assert.deepEqual(res4, '3.141593, 3.14159', test_case)
										 && !assert.deepEqual(res5, '-100, -100, 4294967196', test_case) && !assert.deepEqual(res6, '37777777634, ffffff9c, FFFFFF9C', test_case))
										ut.pass(test_case);
								} catch (e) {
									ut.fail(e, true);
								}
								testEmitter.emit('next');
							});
						});
					});
				});
			});
		});
	}

	tester.scripting50 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type String byte and char";
		var resArray = [];
		client.eval('return string.byte("ABCDE")', 0, function (err, res1) {
			resArray.push(res1);
			client.eval('return string.byte("ABCDE",0)', 0, function (err, res2) {
				resArray.push(res2);
				client.eval('return string.byte("ABCDE",0)', 0, function (err, res3) {
					resArray.push(res3);
					client.eval('return string.byte("ABCDE",3,4)', 0, function (err, res4) {
						resArray.push(res4);
						client.eval('local s = "ABCDE" return s:byte(3,4)', 0, function (err, res5) {
							resArray.push(res5);
							client.eval('return string.char(65,66,67)', 0, function (err, res6) {
								resArray.push(res6);
								client.eval('return string.char()', 0, function (err, res7) {
									resArray.push(res7);
									try {
										if (!assert.deepEqual(resArray, [65, null, null, 67, 67, 'ABC', ''], test_case))
											ut.pass(test_case);
									} catch (e) {
										ut.fail(e, true);
									}
									testEmitter.emit('next');
								});
							});
						});
					});
				});
			});
		});
	}

	tester.scripting51 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type String Ops";
		var resArray = [];
		client.eval('return string.sub("Hello Lua user", 7, 9)', 0, function (err, res) {
			resArray.push(res);
			client.eval('return string.sub("Hello Lua user", -8, -6)', 0, function (err, res) {
				resArray.push(res);
				client.eval('return string.reverse("lua")', 0, function (err, res) {
					resArray.push(res);
					client.eval('return string.rep("Lua ",2)', 0, function (err, res) {
						resArray.push(res);
						client.eval('return string.match("I have 2 questions for you.", "%d+ %a+")', 0, function (err, res) {
							resArray.push(res);
							client.eval('return string.format("%d, %q", string.match("I have 2 questions for you.", "(%d+) (%a+)"))', 0, function (err, res) {
								resArray.push(res);
								client.eval('return string.len("Lua")', 0, function (err, res) {
									resArray.push(res);
									client.eval('return string.len("Lua\000user")', 0, function (err, res) {
										resArray.push(res);
										client.eval('return tostring(null)', 0, function (err, res) {
											resArray.push(res);
											client.eval('return {string.upper ("lua"),string.lower ("LUA"),string.len("Lua")}', 0, function (err, res) {
												resArray.push(res);
												try {
													if (!assert.deepEqual(resArray, ['Lua', 'Lua', 'aul', 'Lua Lua ', '2 questions', '2, "questions"', 3, 8, undefined, ['LUA', 'lua', 3]], test_case))
														ut.pass(test_case);
												} catch (e) {
													ut.fail(e, true);
												}
												testEmitter.emit('next');
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	}

	tester.scripting52 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type String find and pattern";
		var resArray = [];
		client.eval('return string.find("Hello Lua user", "Lua")', 0, function (err, res) {
			resArray.push(res);
			client.eval('return string.find("Hello Lua user", "banana")', 0, function (err, res) {
				resArray.push(res);
				client.eval('return string.find("Hello Lua user", "Lua", 1)', 0, function (err, res) {
					resArray.push(res);
					client.eval('return string.find("Hello Lua user", "Lua", 8)', 0, function (err, res) {
						resArray.push(res);
						client.eval('return string.find("Hello Lua user", "e", -5)', 0, function (err, res) {
							resArray.push(res);
							client.eval('return string.find("Hello Lua user", "%su")', 0, function (err, res) {
								resArray.push(res);
								client.eval('return string.find("Hello Lua user", "%su", 1, true)', 0, function (err, res) {
									resArray.push(res);
									try {
										if (!assert.deepEqual(resArray, [7, null, 7, null, 13, 10, null], test_case))
											ut.pass(test_case);
									} catch (e) {
										ut.fail(e, true);
									}
									testEmitter.emit('next');
								});
							});

						});
					});
				});
			});
		});
	}

	tester.scripting53 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type String gsub and gmatch";
		var resArray = [];
		client.eval('local t = false for i,n in string.gmatch("from=world, to=Lua", "%a+") do t=true end return tostring(t)', 0, function (err, res) {
			resArray.push(res);
			client.eval('return string.gsub("Hello banana", "banana", "Lua user")', 0, function (err, res) {
				resArray.push(res);
				client.eval('return string.gsub("banana", "a", "A", 2)', 0, function (err, res) {
					resArray.push(res);
					client.eval('return string.gsub("banana", "(an)", "%1-")', 0, function (err, res) {
						resArray.push(res);
						client.eval('return string.gsub("banana", "(a)(n)", "%2%1")', 0, function (err, res) {
							resArray.push(res);
							client.eval('return string.gsub("Hello Lua user", "(%w+)", print)', 0, function (err, res) {
								resArray.push(res);
								client.eval('return string.gsub("Hello Lua user", "(%w+)", function(w) return string.len(w) end)', 0, function (err, res) {
									resArray.push(res);
									client.eval('return string.gsub("banana", "(a)", string.upper)', 0, function (err, res) {
										resArray.push(res);
										client.eval('return string.gsub("banana", "(a)(n)", function(a,b) return b..a end)', 0, function (err, res) {
											resArray.push(res);
											try {
												if (!assert.deepEqual(resArray, ['true', 'Hello Lua user', 'bAnAna', 'ban-an-a', 'bnanaa', 'Hello Lua user', '5 3 4', 'bAnAnA', 'bnanaa'], test_case))
													ut.pass(test_case);
											} catch (e) {
												ut.fail(e, true);
											}
											testEmitter.emit('next');
										});
									});
								});
							});
						});
					});
				});
			});
		});
	}

	tester.scripting54 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type Table";
		var resArray = [];
		client.eval('return assert( 1 == 1, "true" )', 0, function (err, res) {
			resArray.push(res);
			client.eval('return assert( 1 == 2, "true" )', 0, function (errorMsg, res) {
				client.eval('local myTable  = { 1, 4, "LUA"} return type(myTable)', 0, function (err, res) {
					resArray.push(res);
					client.eval('local myTable  = { 1, 4, "LUA"} return table.concat(myTable)', 0, function (err, res) {
						resArray.push(res);
						client.eval('local myTable  = { 1, 4, "LUA"} return table.concat(myTable, " space ")', 0, function (err, res) {
							resArray.push(res);
							client.eval('local myTable  = { 1, 4, "LUA"} return table.concat(myTable, " space ", 2, 3)', 0, function (err, res) {
								resArray.push(res);
								client.eval('local myTable  = { 1, 4, "LUA"} table.insert(myTable, 5) return table.concat(myTable)', 0, function (err, res) {
									resArray.push(res);
									client.eval('local myTable  = { 1, 4, "LUA"} return table.getn (myTable)', 0, function (err, res) {
										resArray.push(res);
										client.eval('local myTable  = { 1, 4, "LUA"} table.remove(myTable, 1) return table.getn(myTable)', 0, function (err, res) {
											resArray.push(res);
											client.eval('local myTable  = { 4, 1, 3} table.sort(myTable) return table.concat(myTable)', 0, function (err, res) {
												resArray.push(res);
												client.eval('local myTable  = {"c","a","b"} table.sort(myTable) return table.concat(myTable)', 0, function (err, res) {
													resArray.push(res);
													try {
														if (!assert.deepEqual(resArray, [1, 'table', '14LUA', '1 space 4 space LUA', '4 space LUA', '14LUA5', 3, 2, '134', 'abc'], test_case) && !assert.ok(ut.match("Error", errorMsg), test_case))
															ut.pass(test_case);
													} catch (e) {
														ut.fail(e, true);
													}
													testEmitter.emit('next');
												});
											});
										});
									});

								});
							});
						});
					});
				});
			});
		});
	}

	tester.scripting55 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Math";
		var resArray = [];
		client.eval('return {math.abs(1.1),math.acos(1),math.asin(1),math.atan(1),math.atan2(1,0)}', 0, function (err, res) {
			resArray.push(res);
			client.eval('return{math.cos(1),math.cosh(1)}', 0, function (err, res) {
				resArray.push(res);
				client.eval('return {math.ceil(math.pi),math.deg (0),math.exp (1),math.floor (1.9),math.fmod (3, 2),math.frexp (1),math.ldexp (2,2),math.log (10)}', 0, function (err, res) {
					resArray.push(res);
					client.eval('return {math.max (1,2,3),math.min (1,2,3),math.modf (2),math.pow (2, 2),math.rad (90)}', 0, function (err, res) {
						resArray.push(res);
						client.eval('return {math.sin (90),math.sinh (0),math.sqrt (4),math.tan (45),math.tanh (0)}', 0, function (err, res) {
							resArray.push(res);
							try {
								if (!assert.deepEqual(resArray, [[1, 0, 1, 0, 1], [0, 1], [4, 0, 2, 1, 1, 0, 8, 2], [3, 1, 2, 4, 1], [0, 0, 2, 1, 0]], test_case))
									ut.pass(test_case);
							} catch (e) {
								ut.fail(e, true);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	}

	tester.scripting56 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua loadstring and unpack";
		var resultArray = [];
		client.eval('local f = loadstring("i = i + 1") return {tostring(f)}', 0, function (err, resload) {
			client.eval('return {unpack{10,20,30}}', 0, function (err, res) {
				resultArray.push(res);
				client.eval('local a,b = unpack{10,20,30} return {a,b}', 0, function (err, res) {
					resultArray.push(res);
					try {
						if (!assert.ok(ut.match('function', resload), test_case) && !assert.deepEqual(resultArray, [[10, 20, 30], [10, 20]], test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});
	}

	tester.scripting57 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua coroutine and select";
		var resultArray = [];
		var script = '\
					local co = coroutine.create(function ()\
						return coroutine.wrap(function () return("hi") end)\
					end)\
					';
		client.eval(script + ' return coroutine.status(co)', 0, function (err, res) {
			resultArray.push(res);
			client.eval(script + ' return {coroutine.resume(co),coroutine.status(co)}', 0, function (err, res) {
				resultArray.push(res);
				var script = '\
									local co = coroutine.create(function (a,b)\
									coroutine.yield(a + b, a - b)\
									coroutine.running ()\
									end)\
									';
				client.eval(script + ' return {coroutine.resume(co, 20, 10)}', 0, function (err, res) {
					resultArray.push(res);
					client.eval('return {select(-1, 1, 2, 3),select(1, 1, 2, 3),select(4, 1, 2, 3)}', 0, function (err, res) {
						resultArray.push(res);
						client.eval('return {select("#", {1,2,3}, 4, 5, {6,7,8})}', 0, function (err, res) {
							resultArray.push(res);
							client.eval('return select(0, 1, 2, 3)', 0, function (errZ, res) {
								client.eval('return select(-2,1)', 0, function (errN, res) {
									try {
										if (!assert.deepEqual(resultArray, ['suspended', [1, 'dead'], [1, 30, 10], [3, 1], [4]], test_case)
											 && !assert.ok(ut.match('out of range', errZ), test_case) && !assert.ok(ut.match('out of range', errN), test_case))
											ut.pass(test_case);
									} catch (e) {
										ut.fail(e, true);
									}
									testEmitter.emit('next');
								});
							});
						});
					});
				});
			});
		});
	}

	tester.scripting58 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua newproxy";
		var script = '\
					local a = newproxy(true)\
					getmetatable(a).__len = function() return 5 end\
					local b = newproxy(a)\
					local c = newproxy(false)\
					local is_collected = false\
					local o = newproxy(true)\
					getmetatable(o).__gc = function() is_collected = true end\
					o = nil; collectgarbage()\
					return {type(a),#a,tostring(b ~= a),tostring(getmetatable(b) == getmetatable(a)),#b,tostring(not getmetatable(c)),tostring(is_collected)}';
		client.eval(script, 0, function (err, res) {
			client.eval('local a = newproxy(0) return {type(a)}', 0, function (errE, resE) {
				try {
					if (!assert.deepEqual(res, ['userdata', 5, 'true', 'true', 5, 'true', 'true'], test_case)
						 && !assert.ok(ut.match('boolean or proxy expected', errE), test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting59 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua setfenv";
		var script = '\
					a = 1 \
					setfenv(1, {})\
					return {a}';
		client.eval(script, 0, function (errG, res) {
			script = '\
							local a = 1; \
							local newgt = {}\
							setmetatable(newgt, {__index = _G})\
							setfenv(1, newgt)\
							return a';
			client.eval(script, 0, function (err, res) {
				script = 'return {gcinfo(),getfenv(1)}';
				client.eval(script, 0, function (errL, resL) {
					try {
						if (!assert.ok(ut.match("global variable", errG), test_case) && !assert.equal(res, 1, test_case)
							 && !assert.deepEqual(resL[1], [], test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});
	}

	tester.scripting60 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua pcall and xpcall";
		var script = '\
					local add = function(a,b)\
						return tonumber(a)+tonumber(b)\
					end\
					return {pcall(add,"a"," ")}';
		client.eval(script, 0, function (errP, resP) {
			var script = '\
							local add = function(a,b)\
							return tonumber(a)+tonumber(b)\
							end\
							local err = function(a,b)\
							return "Error in Function"\
							end\
							return {xpcall(add,err,"a"," ")}';
			client.eval(script, 0, function (errXP, resXP) {
				try {
					if (!assert.ok(ut.match("nil value", resP[1]), test_case) && !assert.ok(ut.match("Error", resXP[1]), test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting61 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Running code within code";
		var script = 'local code = [[ return ("Redis") ]]\
					local test = loadstring(code) return test()';
		client.eval(script, 0, function (errL, resL) {
			script = 'local code = string.dump(function() return("Redis") end)\
							local test = loadstring(code)\
							return test()';
			client.eval(script, 0, function (errOL, resOL) {
				script = 'local filefunc = dofile("test.lua")\
									local returnedfunc = filefunc(2, 3)\
									return returnedfunc';
				client.eval(script, 0, function (errStr, resStr) {
					script = 'return {tostring(rawequal(1,1)),tostring(rawequal(1,2))}';
					client.eval(script, 0, function (errLF, resLF) {
						try {
							if (!assert.ok(ut.match("Redis", resL), test_case) && !assert.ok(ut.match("Redis", resOL), test_case)
								 && !assert.ok(ut.match("Error", errStr), test_case) && !assert.deepEqual(resLF, ['true', 'false'], test_case))
								ut.pass(test_case);
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	}

	tester.scripting62 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua pairs and ipairs";
		var script = 'local Name = {"Jones","Smith","Patel","Brown","Ng"}\
					local temp_table={}\
					for index,val in ipairs(Name) do\
					 table.insert(temp_table,index .. " - " .. val)\
					end\
					return table.concat(temp_table,",")';
		client.eval(script, 0, function (errOL, resOL) {
			script = 'local Name = {"Jones","Smith","Patel","Brown","Ng"}\
							local temp_table={}\
							for index,val in pairs(Name) do\
								table.insert(temp_table,index .. " - " .. val)\
							end\
							return table.concat(temp_table,",")';
			client.eval(script, 0, function (errStr, resStr) {
				try {
					if (!assert.equal(resOL, "1 - Jones,2 - Smith,3 - Patel,4 - Brown,5 - Ng", test_case)
						 && !assert.equal(resStr, "1 - Jones,2 - Smith,3 - Patel,4 - Brown,5 - Ng", test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting63 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Json decoding simple types";
		var res_Array = [];
		//var script="return cjson.decode(cjson.encode('{v_rocks:true,whos_v:\"http://www.vishalshah.org\"}'))";
		client.eval("return cjson.decode('\"test string\"')", 0, function (err, res) {
			res_Array.push(res);
			client.eval("return cjson.decode('[0.0, -5e3, -1, 0.3e-3]')", 0, function (err, res) {
				res_Array.push(res);
				client.eval("return cjson.decode('null')", 0, function (err, res) {
					res_Array.push(res);
					client.eval("return {tostring(cjson.decode('true')),tostring(cjson.decode('false'))}", 0, function (err, res) {
						res_Array.push(res);
						client.eval("return cjson.decode(cjson.encode('{\"1\": \"one\", \"3\": \"three\"}'))", 0, function (err, res) {
							res_Array.push(res);
							try {
								if (!assert.deepEqual(res_Array, ["test string", [0, -5000, -1, 0], null, ['true', 'false'], '{"1": "one", "3": "three"}'], test_case))
									ut.pass(test_case);
							} catch (e) {
								ut.fail(e, true);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	}

	tester.scripting64 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Json decoding and encoding errors";
		client.eval("return cjson.decode('{ \"unexpected eof\": ')", 0, function (errTE, res) {
			client.eval("return cjson.decode('{ \"extra data\": true }, false')", 0, function (errTC, res) {
				client.eval("return cjson.decode([[ { bad escape \q code } ]])", 0, function (errI, res) {
					client.eval("return cjson.decode([[ { \"bad escape \q code\"  } ]])", 0, function (errTO, res) {
						client.eval("return cjson.decode('[ -+12 ]')", 0, function (errN, res) {
							client.eval("return cjson.encode({ [false] = \"wrong\" })", 0, function (errEn, res) {
								client.eval("return cjson.decode('\0\"0\"')", 0, function (errSy, res) {
									client.eval("local foo=cjson.null return cjson.decode(foo)", 0, function (errLD, res) {
										try {
											if (!assert.ok(ut.match('Expected value but found T_END', errTE), test_case) &&
												!assert.ok(ut.match('Expected the end but found T_COMMA', errTC), test_case) &&
												!assert.ok(ut.match('Expected object key string but found invalid token', errI), test_case) &&
												!assert.ok(ut.match('Expected colon but found T_OBJ_END', errTO), test_case) &&
												!assert.ok(ut.match('invalid number', errN), test_case) &&
												!assert.ok(ut.match('Cannot serialise', errEn), test_case) &&
												!assert.ok(ut.match('JSON parser does not support UTF-16 or UTF-32', errSy), test_case) &&
												!assert.ok(ut.match('got userdata', errLD), test_case))
												ut.pass(test_case);
										} catch (e) {
											ut.fail(e, true);
										}
										testEmitter.emit('next');
									});
								});
							});
						});
					});
				});
			});
		});
	}

	tester.scripting65 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Json decoding nested arrays / objects";
		var res_Array = [];
		client.eval("return cjson.encode_max_depth(5)", 0, function (err, res) {
			res_Array.push(res);
			client.eval("return cjson.decode('[ \"nested\" ]')", 0, function (err, res) {
				res_Array.push(res);
				client.eval("return cjson.decode(cjson.encode('{\"a\":{\"b\":{\"c\":{\"d\":{\"e\":\"nested\"}}}}}'))", 0, function (err, res) {
					res_Array.push(res);
					try {
						if (!assert.deepEqual(res_Array, [5, ['nested'], '{"a":{"b":{"c":{"d":{"e":"nested"}}}}}'], test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});
	}

	tester.scripting66 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Json encoding simple types";
		var res_Array = [];
		client.eval("return {cjson.encode(true),cjson.encode(false)}", 0, function (err, res) {
			res_Array.push(res);
			client.eval("return {cjson.encode({ }),cjson.encode(10)}", 0, function (err, res) {
				res_Array.push(res);
				try {
					if (!assert.deepEqual(res_Array, [['true', 'false'], ['{}', 10]], test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting67 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Json encoding table tests";
		var res_Array = [];
		client.eval("cjson.encode_sparse_array(true, 2, 3) cjson.encode_max_depth(5) return {cjson.encode({ [3] = \"sparse test\" })}", 0, function (err, res) {
			res_Array.push(res);
			client.eval("cjson.encode_sparse_array(true, 2, 3) cjson.encode_max_depth(5) return cjson.encode({ [1] = \"one\", [4] = \"sparse test\" })", 0, function (err, res) {
				res_Array.push(res);
				client.eval("cjson.encode_sparse_array(true, 2, 3) cjson.encode_max_depth(5) return cjson.encode({ [\"2\"] = \"numeric string key test\" })", 0, function (err, res) {
					res_Array.push(res);
					client.eval("cjson.encode_sparse_array(true, 2, 3) cjson.encode_max_depth(5) return cjson.encode({ {{{{{ \"nested\" }}}}}})", 0, function (err, res) {
						try {
							if (!assert.deepEqual(res_Array, [['[null,null,"sparse test"]'], '["one",null,null,"sparse test"]', '{"2":"numeric string key test"}'], test_case)
								 && !assert.ok(ut.match('excessive nesting', err), test_case))
								ut.pass(test_case);
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	}

	tester.scripting68 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua msgpack";
		var script = '\
						local payload = {1, 2, 3}\
						local varpack = cmsgpack.pack(payload)\
						local varunpack = cmsgpack.unpack(varpack)\
						return varunpack';
		client.eval(script, 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, [1, 2, 3], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting69 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua Json escaping unicode";
		var res_Array = [];
		client.eval("cjson.refuse_invalid_numbers(true) return cjson.encode(tonumber(0/0))", 0, function (errN, res) {
			client.eval("cjson.encode_keep_buffer(true) cjson.encode_number_precision(2) return cjson.encode({1.23})", 0, function (err, resP) {
				client.eval("cjson.refuse_invalid_numbers(false) return cjson.encode(tonumber(0/0))", 0, function (errRF, resRF) {
					client.eval("cjson.encode_number_precision(15) return cjson.encode({1.23})", 0, function (errE, res) {
						try {
							if (!assert.ok(ut.match('NaN or Inf', errN), test_case) &&
								!assert.equal(resP, "[1.2]", test_case) && !assert.equal(resRF, '-1.$', test_case) &&
								!assert.ok(ut.match('expected integer between 1 and 14', errE), test_case))
								ut.pass(test_case);
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	}

	return scripting;
}
	())
