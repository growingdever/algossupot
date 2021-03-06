# 설명 및 문제점
pysandbox는 syscall을 통해 금지된 함수를 호출하는 것을 막습니다.
다만 금지, 허용할 syscall을 미리 정해주어야만 하며, 플랫폼마다 다를 수 있습니다.
또한 바이너리만 실행이 가능하기 떄문에 기계 코드로 컴파일을 할 수 없는 스크립트의 경우 인터프리터를 통해 실행을 하여야 하는데 이 과정에서 여러 종류의 syscall이 발생하므로 이에 대한 처리도 필요합니다.
거기다가 인터프리터를 실행하는데 드는 메모리 및 수행 시간 또한 문제가 됩니다.

# 해결 방안
스크립트 파일 앞에 shebang(hashbang)을 붙여 메모리 및 수행 시간 문제를 해결할 수 있습니다.
syscall 문제에 대해서는 언어별로 간단한 표준입출력을 하는 프로그램 혹은 스크립트를 작성하여 그것을 실행했을 때 호출되는 syscall과 호출 횟수를 기록해 두어 이 횟수 만큼 허용하는 방식을 사용하여 해결 할 수 있습니다.

여기서는 syscall의 기록을 위해 Fibonacci Problem을 푸는 프로그램 혹은 스크립트를 작성합니다.
