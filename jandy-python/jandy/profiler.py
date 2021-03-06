import json
import threading
import traceback

import math
import sys

from jandy.factory import treeNode, profilingContext, exceptionObject
import time


class MethodHandler(object):
    def __init__(self):
        self.nodes = []
        self.current = {'id': None, 'childrenIds': list()}
        self.root = None

    def enter(self, frame):
        if '__package__' in frame.f_globals.keys() and frame.f_globals['__package__'] == 'jandy':
            return

        # print('---- ENTER')
        n = treeNode(frame, self.current['id'])
        if self.root is None:
            self.root = n

        n['acc']['t_startTime'] = time.time()
        n['acc']['concurThreadName'] = threading.current_thread().name
        self.current['childrenIds'].append(n['id'])

        self.nodes.append(self.current)
        self.current = n
        # print('ENTER - '+str(self.current))

    def exit(self, frame, arg, excepted):
        if '__package__' in frame.f_globals.keys() and frame.f_globals['__package__'] == 'jandy':
            return

        # print('---- EXIT: '+str(frame.f_globals))
        startTime = self.current['acc']['t_startTime']
        elapsedTime = time.time() - startTime

        self.current['acc']['startTime'] = math.floor(startTime * 1000.0 * 1000.0 * 1000.0)
        self.current['acc']['elapsedTime'] = math.floor(elapsedTime * 1000.0 * 1000.0 * 1000.0)
        if excepted:
            (exception, value, traceback) = arg
            self.current['acc']['exceptionId'] = exceptionObject(exception, value, traceback)['id']

        # print('EXIT - '+str(self.current))
        if not excepted:
            self.current = self.nodes.pop()


class MethodHandlerContext(object):
    def __init__(self):
        self.methodHandlers = []
        self.local = threading.local()

    def get(self):
        if hasattr(self.local, 'methodHandler') is not True:
            self.local.methodHandler = MethodHandler()
            self.methodHandlers.append(self.local.methodHandler)
        return self.local.methodHandler

    def roots(self):
        return [m.root for m in self.methodHandlers]

class Profiler(object):

    def __init__(self):
        self.context = MethodHandlerContext()

    def start(self):
        sys.settrace(self.trace)

    def stop(self):
        sys.settrace(None)

    def done(self):
        self.stop()
        context = profilingContext(self.context.roots())
        with open("python-profiler-result.jandy", "wt") as f:
            json.dump(context, f)

    def trace(self, frame, event, arg):
        if event == 'call':
            self.context.get().enter(frame)
        elif event == 'return':
            self.context.get().exit(frame, arg, False)
        elif event == 'exception':
            self.context.get().exit(frame, arg, True)
        return self.trace
