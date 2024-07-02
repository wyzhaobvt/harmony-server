CREATE DATABASE  IF NOT EXISTS `projectharmonyserver` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `projectharmonyserver`;


DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `ownerID` int DEFAULT NULL,
  `data` mediumblob,
  `deleted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ownerID` (`ownerID`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`ownerID`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requests`
--

DROP TABLE IF EXISTS `requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(255) DEFAULT NULL,
  `timeCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  `senderID` int DEFAULT NULL,
  `recieverID` int DEFAULT NULL,
  `data` varchar(765) DEFAULT NULL,
  `operation` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT NULL,
  `timeResolved` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `senderID` (`senderID`),
  KEY `recieverID` (`recieverID`),
  CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`senderID`) REFERENCES `users` (`id`),
  CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`recieverID`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requests`
--

LOCK TABLES `requests` WRITE;
/*!40000 ALTER TABLE `requests` DISABLE KEYS */;
INSERT INTO `requests` VALUES (1,'gebye6idtdvimnl71x9l54q7qn1hd0qpgt1dq2fyvewzrqyn4qzv8yjuupfrhbkcq0nirbnsoecdvh5mg8rnaqewc8kiylrve5gsuxwt25xpvcgnivsiw8k8y8wbieq5t1sprh5na9arutdkd1gnl2g7kg5732eavubvd2mqsnm3ufbpz5263fydmz2t2sz7gt1w6zihb8byyffmyhnamu94enoidofqaubmspu0w4roee48smi04o5zdocwar','2024-03-28 13:33:20',1,5,'{\"teamName\":\"Test Team 1\",\"teamUID\":\"99ck86jjnsm3mc4hpwf0krm1notdi2qsxygmqpdhts1mvng74uliwinyn9zh13q5lf30mviwojrj63qefhe0jylyg909bnun4lgal2mipyvcwbxov5mpc212d8r0ipau1oybp5cpclu2y0hqh59epfr69xnzyit3cwy1upuf7dlzxbnabi87g47lhhyko5bj8t98plsr1e7q5x9o49bcjsqkqgm7qh2c40w7sf5753tm8e3i1ch6ocdf3a1vdi\"}','addToTeam','declined',1,'2024-03-29 13:44:50'),(5,'xisdoplmo2c5z4ls2r4p29bdb391syr13idwkp7jvs1v9wtx2oli97usbnrjr4t97xp7t47j2a24lwcak5efqlrfvg3rnhj4yyyyihtubv95ewllvlq476mmwvvfag11fsdl833i32ga9g96e81ocx3v8uko9iwm952526773or2enivdwoxzao75rxs30hzajj54atxzt0po7f347eybi8cz9mcaxr4uk0r7gaqyg486nnz8f2g76l5khx1ba','2024-04-03 13:10:43',5,5,'{\"teamName\":\"Test Team 1\",\"teamUID\":\"jy3tvjj9c4vljpv3vy1kkhnn2hwz3x61epfy744cgrobu975cgbaxb7pofkxykzbfwg3eiazwyawbrv7f15dbsl1st1t5u60j1hg9n9ljtirv6p09diy9uuxjkvvkwkdwwm9nxsebz3y7zxg1ue9v8inyy93k5ah1jstc13mv9w2lrytmssgw8h2isf56gqp8zyclke5nqgxe93n4cxr9dnbhzqnpct7gwc8j2agx3zvf0j93rr1lhreohc6zu\"}','addToTeam','accepted',1,'2024-04-03 13:14:43'),(8,'2i8xwf1l4d9denvzsqizsoy3nmm4dddr9kioa5pjyh1tijlrg5nnfijro2pscvvipbdjw6bvcbeztsdhwxi9x4czxjqd0a8smgms2ejxbzozd8n2l8edvedrwp9ucy70veux63fwmycnmdh9snw8z2vscdbmc6xg1ag2jcojn6tq8krexnfo1zxaju70qmk1zac7mg91ml587b9ufsoi76ske3b8n08e3ke2obh34jvhxwakkerjpwcyoypodf','2024-04-10 12:41:39',1,5,NULL,'addFriend','accepted',1,'2024-04-10 12:52:57');
/*!40000 ALTER TABLE `requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(255) DEFAULT NULL,
  `ownerID` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `teamCallLink` varchar(1020) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ownerID` (`ownerID`),
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`ownerID`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES (4,'99ck86jjnsm3mc4hpwf0krm1notdi2qsxygmqpdhts1mvng74uliwinyn9zh13q5lf30mviwojrj63qefhe0jylyg909bnun4lgal2mipyvcwbxov5mpc212d8r0ipau1oybp5cpclu2y0hqh59epfr69xnzyit3cwy1upuf7dlzxbnabi87g47lhhyko5bj8t98plsr1e7q5x9o49bcjsqkqgm7qh2c40w7sf5753tm8e3i1ch6ocdf3a1vdi',3,'Test Team 3','test-team-3/99ck86jjnsm3mc4hpwf0krm1notdi2qsxygmqpdhts1mvng74uliwinyn9zh13q5lf30mviwojrj63qefhe0jylyg909bnun4lgal2mipyvcwbxov5mpc212d8r0ipau1oybp5cpclu2y0hqh59epfr69xnzyit3cwy1upuf7dlzxbnabi87g47lhhyko5bj8t98plsr1e7q5x9o49bcjsqkqgm7qh2c40w7sf5753tm8e3i1ch6ocdf3a1vdi',0),(5,'yg2bpnpn09ap0zht4x2dn5bp9gr9ascfzfd65iihju96pieapews73nux9t2r7kme7jx5gzxc2qgdtiavzxboxevopxpm5ks7m39gntfndef4utkbcp7kt69b57hqecau4o7jxnli6tckmemxbjr6xtmgo9tcmmoonksywq9gla1mxvfj5zap90ayln8ljcygagjq0njt7oz5f5zfy8zdvownrqbtxbzqjwtiy3qm0530pg2j8jytqvw8coc1i',2,'Test Team 2','test-team-2/yg2bpnpn09ap0zht4x2dn5bp9gr9ascfzfd65iihju96pieapews73nux9t2r7kme7jx5gzxc2qgdtiavzxboxevopxpm5ks7m39gntfndef4utkbcp7kt69b57hqecau4o7jxnli6tckmemxbjr6xtmgo9tcmmoonksywq9gla1mxvfj5zap90ayln8ljcygagjq0njt7oz5f5zfy8zdvownrqbtxbzqjwtiy3qm0530pg2j8jytqvw8coc1i',0),(6,'jy3tvjj9c4vljpv3vy1kkhnn2hwz3x61epfy744cgrobu975cgbaxb7pofkxykzbfwg3eiazwyawbrv7f15dbsl1st1t5u60j1hg9n9ljtirv6p09diy9uuxjkvvkwkdwwm9nxsebz3y7zxg1ue9v8inyy93k5ah1jstc13mv9w2lrytmssgw8h2isf56gqp8zyclke5nqgxe93n4cxr9dnbhzqnpct7gwc8j2agx3zvf0j93rr1lhreohc6zu',1,'Test Team 1','test-team-1/jy3tvjj9c4vljpv3vy1kkhnn2hwz3x61epfy744cgrobu975cgbaxb7pofkxykzbfwg3eiazwyawbrv7f15dbsl1st1t5u60j1hg9n9ljtirv6p09diy9uuxjkvvkwkdwwm9nxsebz3y7zxg1ue9v8inyy93k5ah1jstc13mv9w2lrytmssgw8h2isf56gqp8zyclke5nqgxe93n4cxr9dnbhzqnpct7gwc8j2agx3zvf0j93rr1lhreohc6zu',0);
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teamschats`
--

DROP TABLE IF EXISTS `teamschats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teamschats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(255) DEFAULT NULL,
  `teamID` int DEFAULT NULL,
  `messageUser` int DEFAULT NULL,
  `sentAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `message` varchar(1020) DEFAULT NULL,
  `isFile` tinyint(1) DEFAULT NULL,
  `fileID` int DEFAULT NULL,
  `edited` tinyint(1) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT NULL,
  `fileName` VARCHAR(255) DEFAULT NULL,
  `fileUID` BIGINT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teamID` (`teamID`),
  KEY `messageUser` (`messageUser`),
  KEY `fileID` (`fileID`),
  CONSTRAINT `teamschats_ibfk_1` FOREIGN KEY (`teamID`) REFERENCES `teams` (`id`),
  CONSTRAINT `teamschats_ibfk_2` FOREIGN KEY (`messageUser`) REFERENCES `users` (`id`),
  CONSTRAINT `teamschats_ibfk_3` FOREIGN KEY (`fileID`) REFERENCES `files` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teamschats`
--

LOCK TABLES `teamschats` WRITE;
/*!40000 ALTER TABLE `teamschats` DISABLE KEYS */;
INSERT INTO `teamschats` VALUES (1,'dk5yxps8h8wd1k08mq2vpdkb5m10st4u3nvs1yo6losjopwmf87go7gds1anradqfyjmboawp06mlwg06b9lna5sftm5elucsi6d6747ipxsr5vk15fafqswlo9vtvj9826re9vcu938wvzfsle1mba2oik3jb28co69p3awtq5egjo5y2w9cyg3ancmoaxjd\namf4s3ewpzx1f7adibd5eaaviax15nkxuk51ys44bo5i3jkt0aui6pt89eumz',4,1,'2024-03-21 15:14:36','edited first message',0,NULL,NULL,0),(2,'72ldhmvjmoztdhwnz5ofb8wt7tat850tyqz6cmvaz481kkkiyrozttzgmk603yd1cq61az2okcemmgzitx09cbvwjbkqmqyx6q5ruc1bb8qzatgt09sam14fsfk21nfr22s6skmx07m6j74v34rrt9sj5vz96xv7nbfcadt86q7h390r9huxqdjjdwlx6y30wjn5622f99tq03yemy1u0x22ojaiysm9e50ua0zgrxn7v54yhn7kwe4scsg9as',4,1,'2024-03-21 16:28:05','edited again second message',0,NULL,NULL,0),(3,'34rq46zoobp88j8wilu89di38v74q9gidi5dn4tr1wiuhxs7kw30zxw5faw4qze98iyex03pofx5ndsg4c8mnoasr53ijk3pfmfh7139vsmcg8ivay4abwzywnqsp7dfscsu6cwnth2ml0kqods210ncejd2oidfanquex32lrsxvotua0q9zcnj71uc0szy0jk3wrn2y22uzl2yq57k4zs6m7ynvzh7sn4hcyhi6yxwg1wpiqz244fx2nti4w',4,1,'2024-03-21 16:32:28','third message',0,NULL,NULL,1),(4,'voazivufvlc7i1v7gsrzm91sgqxsx86r36gqazzi9awkwt03yheno9ff3olpyze6kd1zcz6ojjhcwg5atzebkk21gaojeyviljqwqsgbmys4a91v84aj6sz4ek1ic4frytliol7ouwj8mx420eu3olazr56yph058evywp4rs2qr5nsm8e5hawyzbsetpjdwl6nya9jyk3f9k1whwfaqoqjgl1w465l6fkhywpct0p98udyao2yjn6w6nyybcv',5,2,'2024-03-22 13:33:59','Team 2 message edited',0,NULL,1,0);
/*!40000 ALTER TABLE `teamschats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teamslinks`
--

DROP TABLE IF EXISTS `teamslinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teamslinks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teamID` int DEFAULT NULL,
  `addUser` int DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teamID` (`teamID`),
  KEY `addUser` (`addUser`),
  CONSTRAINT `teamslinks_ibfk_1` FOREIGN KEY (`teamID`) REFERENCES `teams` (`id`),
  CONSTRAINT `teamslinks_ibfk_2` FOREIGN KEY (`addUser`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teamslinks`
--

LOCK TABLES `teamslinks` WRITE;
/*!40000 ALTER TABLE `teamslinks` DISABLE KEYS */;
INSERT INTO `teamslinks` VALUES (1,6,4,0),(2,5,5,0),(3,4,4,0),(4,4,5,0),(5,4,1,0),(7,6,5,0);
/*!40000 ALTER TABLE `teamslinks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `userCallLink` varchar(1020) DEFAULT NULL,
  `profileURL` varchar(765) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'testuser1@email.com','$2b$10$ycUnxyl60wHRFVB5ZRAfw.o8AYLCgrCBJAFj9XuqnHkmIt9JxxL9u','testuser1@email.com','$2b$10$EhGgrrWsQu/lGy/JyHyq7.1EZcu2TnsOdG1cD9SmZsTMg4VvJuLF2/lgzdqbq07bty9ae907c03y2lkyt5mast8lc96ysqjll7zaxt2iu5e1swyuflwsmcipinp9s9gnwh4r60r1556nypo0wfdvyjt6l8ji37nrfxnzeyuqzv4m0l7w5gucy7lxtr9ndvdsy2z0hoii5335wmi75tp9ilnmgns0cb48ua27zh4cxrryjiuylhnro3aecy0e7l75hvq57zte4cjtr3yv6om44e8ht61icm6hsyk3fqqldf7d07m7i2eo','',0),(2,'testuser2@email.com','$2b$10$vPPct2qWClEUSVhh.WUD4uBuqIX64yt0efznkd0qi1ZH8w.VwAyVO','testuser2@email.com','$2b$10$NqaolBfQYX8D6ZBP2Soqm.DyB.RL8lrOCXxh5BBUD9tPX.ET3OIhS/n7bcpkhebmcz6wd7geleqo05pqp1esbjhrn3t7bu2ak0jrte18ww9wdsqm0fxqqqzaid5b87p5tmgbo7u1k09h88y5vadsfwe0m4a7ce5ewhki5v34fy8xtgkhi0bihyhog7d2l7rqdkk8a3fl3qd7q79jq9klzlxjnuk1wz91konah3vxpbvgupnupf8hy86tbmpkcvn1islulh82vyrr4udffizc6f56agssocupmiixlj98p9n5bb0rxfdj','',0),(3,'testuser3@email.com','$2b$10$r0jrNwZ.JoZlM7rvJdWGWOpjejjNtLiZ73s5Mq7CBiQ7l8cavg.ey','testuser3@email.com','$2b$10$3Iphbo8CqEkNW2Q5I7xEn.AMQOVEsQE/C6ZvD9QXkgD/sYBiziozS/rgx79o6loacdwbfu7fysjowllmwanju97wnartxqhphso5mljml0cxct088e5tp74d3snnpt1vrz0ddo6a5o0jzvw5lijrr78armng9zek9cfsoo6bb2k588ty4zre5nz4iq7rg0xkbwbdb5r7ysn7ejft9nq7rad2ocohazvxxy7v2go7b3ltbkqc2biaj5cjmanhobhvuxqiwh472sx761u8056icmt2m2zsak0ye1oa7fh59kl47n2yvleq','',0),(4,'testuser4@email.com','$2b$10$e5kB06mvJ238ICOWXTvWEuwf4BAfK1usUXqfecEnCCGXSwjzKQjSm','testuser4@email.com','$2b$10$5vxm/Jo5hFyxZwwSwClRCeP9d..ozscVLEcl/uMI7UJXXoSSwomWy/sndl4un8lgfcumgw7c3h17vm8z5zn3esixfkq6iv93wrlgoykrybyjnhkv1n6k7dopqhq7icokq77gf8n00o6mzpq8v3gqqlouzb0v8oih237e0t4tqwmcc35herfjew2opmhv1bnfuj8fn4vbkpgz38v9h82bdh9gcjpxnm4m2f6fyeopwda4prz4vpsn5htcalgkok1ga0mzsl8ja32lkrczneilad5kt39jnydvs1hlzch0v8ecf7mnq2gq','',0),(5,'testuser5@email.com','$2b$10$tmOxj4iNj3qYRu/0s5ER4euRzj45dOp19KGuRoUbmnK6GFQvbCvg2','testuser5@email.com','$2b$10$RTWVYb46Ezu1gL9Zmm3nN.1BoddOLZb6H0vtdIbnWIuu4oHmyGuN6/zxt6zkj2du8maoaq5bxlp4lyzknynteh607k2le6uls5bx252rrro31ev4xjsxq7a5lsco19fee21e170lczuf06bjkkkzcygnmqq4e38nsjuprxhu6ukic5pysb1ii2nljmsb6k0irqhus1tyoepylkvx0r20ypiwwswoq4b1ljj2ubimxpnc6fyju0rqockpxvyufwzh6606r7mp51o0k0abpkabbu0fn1kyygekl0h3on9ug33srerqkwh2','',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userschats`
--

DROP TABLE IF EXISTS `userschats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userschats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userSender` int DEFAULT NULL,
  `userReciever` int DEFAULT NULL,
  `sentAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `message` varchar(1020) DEFAULT NULL,
  `isFile` tinyint(1) DEFAULT NULL,
  `fileID` int DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userSender` (`userSender`),
  KEY `userReciever` (`userReciever`),
  KEY `fileID` (`fileID`),
  CONSTRAINT `userschats_ibfk_1` FOREIGN KEY (`userSender`) REFERENCES `users` (`id`),
  CONSTRAINT `userschats_ibfk_2` FOREIGN KEY (`userReciever`) REFERENCES `users` (`id`),
  CONSTRAINT `userschats_ibfk_3` FOREIGN KEY (`fileID`) REFERENCES `files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userschats`
--

LOCK TABLES `userschats` WRITE;
/*!40000 ALTER TABLE `userschats` DISABLE KEYS */;
/*!40000 ALTER TABLE `userschats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userslinks`
--

DROP TABLE IF EXISTS `userslinks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userslinks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userID1` int DEFAULT NULL,
  `userID2` int DEFAULT NULL,
  `blocked` tinyint(1) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userID1` (`userID1`),
  KEY `userID2` (`userID2`),
  CONSTRAINT `userslinks_ibfk_1` FOREIGN KEY (`userID1`) REFERENCES `users` (`id`),
  CONSTRAINT `userslinks_ibfk_2` FOREIGN KEY (`userID2`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userslinks`
--

LOCK TABLES `userslinks` WRITE;
/*!40000 ALTER TABLE `userslinks` DISABLE KEYS */;
INSERT INTO `userslinks` VALUES (1,1,5,NULL,1);
/*!40000 ALTER TABLE `userslinks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-25 14:22:09
