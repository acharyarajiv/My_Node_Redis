exports.Pubsub = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	pubsub = {},
	name = 'PubSub',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = {},
	server_host = '',
	server_host = '',
	sub_msg = [],
	unsub_msg = [];

	//public property
	pubsub.debug_mode = false;

	//public method
	pubsub.start_test = function (client_pid, callback) {
		testEmitter.on('start', function () {
			var tags = 'pubsub';
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
				server_host = g.srv[client_pid][server_pid]['host'];
				server_port = g.srv[client_pid][server_pid]['port'];
				g.srv[client_pid][server_pid]['client'].end();
				if (pubsub.debug_mode) {
					log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
				}
				all_tests = Object.keys(tester);
				testEmitter.emit('next');
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
					testEmitter.emit('end');
				}
		});
		testEmitter.on('end', function () {
			server.kill_server(client_pid, server_pid, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			});
		});

		if (pubsub.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//private methods
	function subscribe(client, channels, callback) {
		var sub_counts = [];
		client.on('subscribe', function (channel, count) {
			sub_counts.push(count);
		});
		client.on('message', function (channel, message) {
			sub_msg.push(message);
		});

		client.subscribe(ut.expand(channels), function (err, res) {
			if (err) {
				callback(err, null);
			}
			process.nextTick(function () {
				callback(null, sub_counts)
			});

		});
	}

	function unsubscribe(client, channels, callback) {
		var unsub_counts = [];
		client.on('unsubscribe', function (channel, count) {
			unsub_counts.push(count);
		});
		client.on('message', function (channel, message) {
			unsub_msg.push(message);
		});

		if (channels != '') {
			client.unsubscribe(ut.expand(channels), function (err, res) {
				if (err) {
					callback(err, null);
				}
				process.nextTick(function () {
					callback(null, unsub_counts)
				});
			});
		} else {
			client.unsubscribe(function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, unsub_counts)
			});
		}
	}

	function psubscribe(client, channels, callback) {
		var psub_counts = [];
		client.on('psubscribe', function (channel, count) {
			psub_counts.push(count);
		});
		client.on('pmessage', function (channel, message) {
			sub_msg.push(message);
		});

		client.psubscribe(ut.expand(channels), function (err, res) {
			if (err) {
				callback(err, null);
			}
			process.nextTick(function () {
				callback(null, psub_counts)
			});

		});
	}

	function punsubscribe(client, channels, callback) {
		var punsub_counts = [];
		client.on('punsubscribe', function (channel, count) {
			punsub_counts.push(count);
		});
		client.on('pmessage', function (channel, message) {
			unsub_msg.push(message);
		});

		if (channels != '') {
			client.punsubscribe(ut.expand(channels), function (err, res) {
				if (err) {
					callback(err, null);
				}
				process.nextTick(function () {
					callback(null, punsub_counts)
				});
			});
		} else {
			client.punsubscribe(function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, punsub_counts)
			});
		}
	}

	//test methods
	tester.psub1 = function (errorCallback) {
		var test_case = 'PUBLISH/SUBSCRIBE basics';
		var result1 = [],
		result2 = [],
		result3 = [],
		client = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1 = redis.createClient(server_port, server_host);
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		async.series({
			one : function (async_cb) {
				//subscribe to two channels
				subscribe(client1, ['chan1', 'chan2'], function (err, res) {
					if (err) {
						async_cb(err, null);
					}
					result1.push(res);
					client.publish('chan1', 'hello', function (err, res) {
						if (err) {
							async_cb(err, null);
						}
						result1.push(res);
						client.publish('chan2', 'world', function (err, res) {
							if (err) {
								async_cb(err, null);
							}
							result1.push(res);
							result1.push(sub_msg); // hello and world should be emitted.
							sub_msg = [];
							async_cb(null, result1);
						});
					});
				});
			},
			two : function (async_cb) {
				//unsubscribe from one of the channels
				unsubscribe(client1, ['chan1'], function (err, res) {
					if (err) {
						async_cb(err, null);
					}
					client.publish('chan1', 'hello', function (err, res) {
						if (err) {
							async_cb(err, null);
						}
						result2.push(res);
						client.publish('chan2', 'world', function (err, res) {
							if (err) {
								async_cb(err, null);
							}
							result2.push(res);
							result2.push(unsub_msg); //world should be emitted.
							unsub_msg = [];
							sub_msg = [];
							async_cb(null, result2);
						});
					});
				});
			},
			three : function (async_cb) {
				//unsubscribe from the remaining channel
				unsubscribe(client1, ['chan2'], function (err, res) {
					if (err) {
						async_cb(err, null);
					}
					client.publish('chan1', 'hello', function (err, res) {
						if (err) {
							async_cb(err, null);
						}
						result3.push(res);
						client.publish('chan2', 'world', function (err, res) {
							if (err) {
								async_cb(err, null);
							}
							result3.push(res);
							async_cb(null, result3);
						});
					});
				});
			},
		}, function (err, results) {
			if (err) {
				errorCallback(err);
			}
			ut.assertMany(
				[
					['deepequal',results.one,[[1, 2], 1, 1, ['hello', 'world']]],
					['deepequal',results.two,[0, 1, ['world']]],
					['deepequal',results.three, [0, 0]]
				],test_case);
			client.end();
			client1.end();
			if (pubsub.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
	};

	tester.psub2 = function (errorCallback) {
		var test_case = 'PUBLISH/SUBSCRIBE with two clients';
		var result = [],
		client = redis.createClient(server_port, server_host),
		client1 = redis.createClient(server_port, server_host),
		client2 = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client2.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		subscribe(client1, ['chan1'], function (err, res) {
			if (err) {
				errorCallback(err);
			}
			result.push(res);
			subscribe(client2, ['chan1'], function (err, res) {
				if (err) {
					errorCallback(err);
				}
				result.push(res);
				client.publish('chan1', 'hello', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result.push(res);
					result.push(sub_msg);
					sub_msg = [];
					unsub_msg = [];
					
					ut.assertDeepEqual(result,[[1],[1], 2, ['hello', 'hello']],test_case);
					client.end();
					client1.end();
					client2.end();
					if (pubsub.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	tester.psub3 = function (errorCallback) {
		var test_case = 'PUBLISH/SUBSCRIBE after UNSUBSCRIBE without arguments';
		var result = [],
		client = redis.createClient(server_port, server_host);
		client1 = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		subscribe(client1, ['chan1', 'chan2', 'chan3'], function (err, res) {
			if (err) {
				errorCallback(err);
			}
			result.push(res);
			unsubscribe(client1, '', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.publish('chan1', 'hello', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result.push(res);
					client.publish('chan2', 'hello', function (err, res) {
						if (err) {
							errorCallback(err);
						}
						result.push(res);
						client.publish('chan3', 'hello', function (err, res) {
							if (err) {
								errorCallback(err);
							}
							result.push(res);
							ut.assertDeepEqual(result,[[1, 2, 3], 0, 0, 0],test_case);
							client.end();
							client1.end();
							if (pubsub.debug_mode) {
								log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
								log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	};
	tester.psub4 = function (errorCallback) {
		var test_case = 'SUBSCRIBE to one channel more than once';
		var result = [],
		client = redis.createClient(server_port, server_host);
		client1 = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		subscribe(client1, ['chan1', 'chan1', 'chan1'], function (err, res) {
			if (err) {
				errorCallback(err);
			}
			result.push(res);
			client.publish('chan1', 'hello', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				result.push(res);
				result.push(sub_msg);
				sub_msg = [];
				unsub_msg = [];
				ut.assertDeepEqual(result,[[1, 1, 1], 1, ['hello']],test_case);
				client.end();
				client1.end();
				if (pubsub.debug_mode) {
					log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
					log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
				}
				testEmitter.emit('next');
			});
		});
	};

	tester.psub5 = function (errorCallback) {
		var test_case = 'UNSUBSCRIBE from non-subscribed channels';
		var result = [],
		client = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1 = redis.createClient(server_port, server_host);
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		// client.unsubscribe([],callback) - returns just one of the unsubscribed channed. This is seen in redis-cli.exe as well.
		// Moreoever, client.unsubscribe(['foo','bar','quux'],callback) - breaks node_redis. Hence calling one by one.
		// Since we have an array, the return is cumulated, hence the deviation.
		unsubscribe(client1, ['foo'], function (err, res) {
			if (err) {
				errorCallback(err);
			}
			result.push(res);
			unsubscribe(client1, ['bar'], function (err, res) {
				if (err) {
					errorCallback(err);
				}
				result.push(res);
				unsubscribe(client1, ['quux'], function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result.push(res);
					ut.assertDeepEqual(result, [[0, 0, 0], [0, 0], [0]], test_case);
					client.end();
					client1.end();
					if (pubsub.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	tester.psub6 = function (errorCallback) {
		var test_case = 'PUBLISH/PSUBSCRIBE basics';
		var result1 = [],
		result2 = [],
		result3 = [],
		client = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1 = redis.createClient(server_port, server_host);
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		async.series({
			one : function (async_cb) {
				//subscribe to two patterns
				psubscribe(client1, ['foo.*', 'bar.*'], function (err, res) {
					if (err) {
						async_cb(err, null);
					}
					result1.push(res);
					client.publish('foo.1', 'hello', function (err, res) {
						if (err) {
							async_cb(err, null);
						}
						result1.push(res);
						client.publish('bar.1', 'world', function (err, res) {
							if (err) {
								async_cb(err, null);
							}
							result1.push(res);
							client.publish('foo1', 'hello', function (err, res) {
								if (err) {
									async_cb(err, null);
								}
								result1.push(res);
								client.publish('barfoo.1', 'hello', function (err, res) {
									if (err) {
										async_cb(err, null);
									}
									result1.push(res);
									client.publish('qux.1', 'hello', function (err, res) {
										if (err) {
											async_cb(err, null);
										}
										result1.push(res);
										result1.push(sub_msg); // hello and world should be emitted.
										sub_msg = [];
										async_cb(null, result1);
									});
								});
							});
						});
					});
				});
			},
			two : function (async_cb) {
				//unsubscribe from one of the patterns
				punsubscribe(client1, ['foo.*'], function (err, res) {
					if (err) {
						async_cb(err, null);
					}
					// here punsubscribe event is emitted suggesting foo.* is unsubscribed but bar.* is still subscribed. Since node_redis returns new count of subscriptions for the client.
					//hence result should be [1 0] not just [1]
					result2.push(res);
					client.publish('foo.1', 'hello', function (err, res) {
						if (err) {
							async_cb(err, null);
						}
						result2.push(res);
						client.publish('bar.1', 'hello', function (err, res) {
							if (err) {
								async_cb(err, null);
							}
							result2.push(res);
							result2.push(unsub_msg);
							unsub_msg = [];
							sub_msg = [];
							async_cb(null, result2);
						});
					});
				});
			},
			three : function (async_cb) {
				//unsubscribe from the remaining pattern
				punsubscribe(client1, ['bar.*'], function (err, res) {
					if (err) {
						async_cb(err, null);
					}
					result3.push(res);
					client.publish('foo.1', 'hello', function (err, res) {
						if (err) {
							async_cb(err, null);
						}
						result3.push(res);
						client.publish('bar.1', 'hello', function (err, res) {
							if (err) {
								async_cb(err, null);
							}
							result3.push(res);
							async_cb(null, result3);
						});
					});
				});
			},

		}, function (err, results) {
			if (err) {
				errorCallback(err);
			}
			ut.assertMany(
				[
					['deepequal', results.one, [[1, 2], 1, 1, 0, 0, 0, ['foo.1', 'bar.1']]],
					['deepequal', results.two, [[1, 0], 0, 1, ['bar.1']]],
					['deepequal', results.three, [[0], 0, 0]]
				],test_case);
			client.end();
			client1.end();
			if (pubsub.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
	};
	tester.psub7 = function (errorCallback) {
		var test_case = 'PUBLISH/PSUBSCRIBE with two clients';
		var result = [],
		client = redis.createClient(server_port, server_host),
		client1 = redis.createClient(server_port, server_host),
		client2 = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client2.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		psubscribe(client1, ['chan.*'], function (err, res) {
			if (err) {
				errorCallback(err);
			}
			result.push(res);
			psubscribe(client2, ['chan.*'], function (err, res) {
				if (err) {
					errorCallback(err);
				}
				result.push(res);
				client.publish('chan.foo', 'hello', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result.push(res);
					result.push(sub_msg);
					sub_msg = [];
					unsub_msg = [];
					ut.assertDeepEqual(result, [[1],[1], 2, ['chan.foo', 'chan.foo']], test_case);
					client.end();
					client1.end();
					client2.end();
					if (pubsub.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
					}
					testEmitter.emit('next');
				});
			});
		});
	};
	tester.psub8 = function (errorCallback) {
		var test_case = 'PUBLISH/PSUBSCRIBE after PUNSUBSCRIBE without arguments';
		var result = [],
		client = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1 = redis.createClient(server_port, server_host);
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		psubscribe(client1, ['chan1.*', 'chan2.*', 'chan3.*'], function (err, res) {
			if (err) {
				errorCallback(err);
			}
			result.push(res);
			punsubscribe(client1, '', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.publish('chan1.hi', 'hello', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result.push(res);
					client.publish('chan2.hi', 'hello', function (err, res) {
						if (err) {
							errorCallback(err);
						}
						result.push(res);
						client.publish('chan3.hi', 'hello', function (err, res) {
							if (err) {
								errorCallback(err);
							}
							result.push(res);
							ut.assertDeepEqual(result, [[1, 2, 3], 0, 0, 0], test_case);
							client.end();
							client1.end();
							if (pubsub.debug_mode) {
								log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
								log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	};
	tester.psub9 = function (errorCallback) {
		var test_case = 'PUNSUBSCRIBE from non-subscribed channels';
		var result = [],
		client = redis.createClient(server_port, server_host);
		client1 = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		// client.punsubscribe([],callback) - returns just one of the unsubscribed channed. This is seen in redis-cli.exe as well.
		// Moreoever, client.punsubscribe(['foo.*','bar.*','quux.*'],callback) - breaks node_redis. Hence calling one by one.
		// Since we have an array, the return is cumulated, hence the deviation.
		punsubscribe(client1, ['foo.*'], function (err, res) {
			if (err) {
				errorCallback(err);
			}
			result.push(res);
			punsubscribe(client1, ['bar.*'], function (err, res) {
				if (err) {
					errorCallback(err);
				}
				result.push(res);
				punsubscribe(client1, ['quux.*'], function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result.push(res);
					ut.assertDeepEqual(result, [[0, 0, 0], [0, 0], [0]], test_case);
					client.end();
					client1.end();
					if (pubsub.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
					}
					testEmitter.emit('next');
				});
			});
		});
	};
	tester.psub10 = function (errorCallback) {
		var test_case = 'Mix SUBSCRIBE and PSUBSCRIBE';
		var result = [],
		client = redis.createClient(server_port, server_host);
		client.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		client1 = redis.createClient(server_port, server_host);
		client1.on('ready', function () {
			if (pubsub.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		subscribe(client1, ['foo.bar'], function (err, res) {
			if (err) {
				errorCallback(err);
			}
			result.push(res);
			psubscribe(client1, ['foo.*'], function (err, res) {
				if (err) {
					errorCallback(err);
				}
				result.push(res);
				client.publish('foo.bar', 'hello', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result.push(res);
					result.push(sub_msg);
					sub_msg = [];
					ut.assertDeepEqual(result, [[1],[2], 2, ['hello', 'foo.bar']], test_case);
					client.end();
					client1.end();
					if (pubsub.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
						log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	return pubsub;

}
	());