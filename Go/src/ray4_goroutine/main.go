package main

import (
	"fmt"
	"time"	
)


func main() {

	start := time.Now()

	RenderDefaultSceneToPNG("test.png", 1024)

	elapsed := time.Since(start)
	fmt.Println(elapsed)
}


